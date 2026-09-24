import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAccessToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization") ??
    "";

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return "";
  }

  return authorization.slice(7).trim();
}

function getUserClient(
  accessToken: string
) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "SERVER_CONFIGURATION_ERROR"
    );
  }

  return createClient(
    supabaseUrl,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },

      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    }
  );
}

function getServerClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "SERVER_CONFIGURATION_ERROR"
    );
  }

  return createClient(
    supabaseUrl,
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
  request: NextRequest,
  context: {
    params: Promise<{
      trackingId: string;
    }>;
  }
) {
  try {
    // =========================
    // TRACKING ID
    // =========================

    const { trackingId } =
      await context.params;

    const cleanTrackingId =
      trackingId?.trim();

    if (!cleanTrackingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tracking ID không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // =========================
    // AUTH
    // =========================

    const accessToken =
      getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bạn chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    const userClient =
      getUserClient(accessToken);

    const {
      data: { user },
      error: userError,
    } =
      await userClient.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Phiên đăng nhập không hợp lệ.",
        },
        { status: 401 }
      );
    }

    // =========================
    // LOAD AFFILIATE LINK
    // =========================

    const serverClient =
      getServerClient();

    /*
     * Service role được dùng để đọc,
     * nhưng luôn bắt buộc cả:
     *
     * tracking_id = trackingId
     * user_id = user.id
     *
     * nên user không thể đọc tracking
     * của tài khoản khác.
     */

    const {
      data: link,
      error: linkError,
    } = await serverClient
      .from("affiliate_links")
      .select(`
        id,
        user_id,
        platform,
        tracking_id,
        original_url,
        affiliate_url,
        featured_product_id,
        created_at
      `)
      .eq(
        "tracking_id",
        cleanTrackingId
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (linkError) {
      console.error(
        "Load affiliate link error:",
        linkError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Không thể tải link hoàn tiền.",
        },
        { status: 500 }
      );
    }

    if (!link) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không tìm thấy link hoàn tiền này.",
        },
        { status: 404 }
      );
    }

    // =========================
    // FEATURED PRODUCT
    // =========================

    let product = null;

    if (
      link.featured_product_id
    ) {
      const {
        data: productData,
        error: productError,
      } = await serverClient
        .from("featured_products")
        .select(`
          id,
          name,
          platform,
          product_url,
          image_url,
          price,
          original_price,
          cashback_percent
        `)
        .eq(
          "id",
          link.featured_product_id
        )
        .maybeSingle();

      if (productError) {
        /*
         * Không làm hỏng affiliate
         * link chỉ vì metadata sản phẩm
         * không tải được.
         */
        console.error(
          "Load featured product error:",
          productError
        );
      } else {
        product =
          productData ?? null;
      }
    }

    return NextResponse.json({
      success: true,
      link,
      product,
    });
  } catch (error) {
    console.error(
      "GET tracking link error:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "SERVER_CONFIGURATION_ERROR"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Server chưa được cấu hình đầy đủ.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Có lỗi xảy ra trên server.",
      },
      { status: 500 }
    );
  }
}