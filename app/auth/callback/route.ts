import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

function getSafeNext(
  value: string | null
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }

  return value;
}

function getReferralCode(
  value: string | null
) {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .toUpperCase()
    .slice(0, 64);
}

function buildRedirectUrl(
  request: Request,
  origin: string,
  path: string
) {
  const forwardedHost =
    request.headers.get(
      "x-forwarded-host"
    );

  const forwardedProto =
    request.headers.get(
      "x-forwarded-proto"
    );

  const isLocal =
    process.env.NODE_ENV ===
    "development";

  if (isLocal) {
    return `${origin}${path}`;
  }

  if (forwardedHost) {
    const protocol =
      forwardedProto === "http"
        ? "http"
        : "https";

    return `${protocol}://${forwardedHost}${path}`;
  }

  return `${origin}${path}`;
}

export async function GET(
  request: Request
) {
  const {
    searchParams,
    origin,
  } = new URL(request.url);

  const code =
    searchParams.get("code");

  const next =
    getSafeNext(
      searchParams.get("next")
    );

  const referralCode =
    getReferralCode(
      searchParams.get("ref")
    );

  if (!code) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        origin,
        "/login?error=auth_callback"
      )
    );
  }

  try {
    const supabase =
      await createClient();

    const {
      error: exchangeError,
    } =
      await supabase.auth
        .exchangeCodeForSession(
          code
        );

    if (exchangeError) {
      console.error(
        "Auth callback exchange error:",
        exchangeError
      );

      return NextResponse.redirect(
        buildRedirectUrl(
          request,
          origin,
          "/login?error=auth_callback"
        )
      );
    }

    /*
     * Sau exchangeCodeForSession(),
     * Supabase server client đã có
     * authenticated session.
     *
     * Nếu URL có ref thì áp referral.
     */
    if (referralCode) {
      const {
        error: referralError,
      } =
        await supabase.rpc(
          "apply_referral_code",
          {
            p_referral_code:
              referralCode,
          }
        );

      if (referralError) {
        /*
         * Không chặn đăng nhập nếu:
         * - mã không hợp lệ
         * - user đã có referrer
         * - user tự nhập mã của mình
         *
         * Database vẫn là nơi bảo vệ
         * quan hệ referral.
         */
        console.warn(
          "Referral callback warning:",
          referralError.message
        );
      }
    }

    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        origin,
        next
      )
    );
  } catch (error) {
    console.error(
      "Auth callback error:",
      error
    );

    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        origin,
        "/login?error=auth_callback"
      )
    );
  }
}