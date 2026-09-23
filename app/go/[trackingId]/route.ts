import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Thiếu Supabase server config.");
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      trackingId: string;
    }>;
  }
) {
  try {
    const { trackingId } =
      await context.params;

    const cleanTrackingId =
      trackingId.trim();

    if (!cleanTrackingId) {
      return new NextResponse(
        "Tracking ID không hợp lệ.",
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabase();

    const {
      data: link,
      error: linkError,
    } = await supabase
      .from("affiliate_links")
      .select(
        "id, affiliate_url, tracking_id"
      )
      .eq(
        "tracking_id",
        cleanTrackingId
      )
      .maybeSingle();

    if (linkError) {
      console.error(
        "Load affiliate link error:",
        linkError
      );

      return new NextResponse(
        "Không thể tìm affiliate link.",
        {
          status: 500,
        }
      );
    }

    if (!link) {
      return new NextResponse(
        "Affiliate link không tồn tại.",
        {
          status: 404,
        }
      );
    }

    /*
     * Tăng click.
     *
     * Dùng update trực tiếp ở bước đầu.
     * Sau này có thể chuyển sang RPC
     * atomic increment nếu traffic lớn.
     */
    const currentClicks =
      0;

    const {
      data: currentLink,
      error: currentLinkError,
    } = await supabase
      .from("affiliate_links")
      .select("clicks")
      .eq("id", link.id)
      .single();

    if (!currentLinkError) {
      await supabase
        .from("affiliate_links")
        .update({
          clicks:
            Number(
              currentLink?.clicks ?? 0
            ) + 1,
        })
        .eq(
          "id",
          link.id
        );
    }

    /*
     * Redirect affiliate URL thật.
     */
    return NextResponse.redirect(
      link.affiliate_url,
      302
    );
  } catch (error) {
    console.error(
      "Affiliate redirect error:",
      error
    );

    return new NextResponse(
      "Không thể xử lý affiliate link.",
      {
        status: 500,
      }
    );
  }
}