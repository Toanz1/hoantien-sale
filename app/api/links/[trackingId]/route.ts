import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type SnapshotProduct = {
  id: string;
  name: string;
  platform: string;
  product_url: string;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  cashback_percent: number | null;
};

/* =========================================================
   ACCESS TOKEN
========================================================= */

function getAccessToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization") ?? "";

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return "";
  }

  return authorization.slice(7).trim();
}

/* =========================================================
   USER SUPABASE CLIENT
========================================================= */

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

/* =========================================================
   SERVER SUPABASE CLIENT
========================================================= */

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

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      trackingId: string;
    }>;
  }
) {
  try {
    // =====================================================
    // 1. TRACKING ID
    // =====================================================

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

    // =====================================================
    // 2. AUTH
    // =====================================================

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
      console.error(
        "GET /api/links/[trackingId] auth error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Phiên đăng nhập không hợp lệ.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // 3. SERVER CLIENT
    // =====================================================

    const serverClient =
      getServerClient();

    // =====================================================
    // 4. LOAD AFFILIATE LINK
    // =====================================================

    /*
     * Service role bypass RLS.
     *
     * Vì vậy luôn bắt buộc:
     *
     * tracking_id = cleanTrackingId
     * user_id     = user.id
     *
     * Không được bỏ điều kiện user_id.
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
        product_name,
        product_image_url,
        product_price,
        product_original_price,
        cashback_percent,
        created_at
      `)
      .eq(
        "tracking_id",
        cleanTrackingId
      )
      .eq(
        "user_id",
        user.id
      )
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

    // =====================================================
    // 5. PRODUCT
    // =====================================================

    let product:
      | SnapshotProduct
      | null = null;

    // =====================================================
    // 5A. FEATURED PRODUCT
    // =====================================================

    /*
     * Nếu link được tạo từ sản phẩm Admin:
     *
     * featured_products là nguồn chính.
     */

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
         * Metadata lỗi không được làm
         * hỏng affiliate link.
         */
        console.error(
          "Load featured product error:",
          productError
        );
      } else if (productData) {
        product = {
          id:
            productData.id,

          name:
            productData.name,

          platform:
            productData.platform,

          product_url:
            productData.product_url,

          image_url:
            productData.image_url ?? null,

          price:
            productData.price == null
              ? null
              : Number(
                  productData.price
                ),

          original_price:
            productData.original_price ==
            null
              ? null
              : Number(
                  productData.original_price
                ),

          cashback_percent:
            productData.cashback_percent ==
            null
              ? null
              : Number(
                  productData.cashback_percent
                ),
        };
      }
    }

    // =====================================================
    // 5B. SNAPSHOT PRODUCT
    // =====================================================

    /*
     * Nếu user tự dán link:
     *
     * featured_product_id = null
     *
     * Metadata sẽ lấy từ snapshot
     * đã lưu trong affiliate_links.
     */

    if (
      !product &&
      link.product_name
    ) {
      product = {
        /*
         * Không phải ID của featured_products.
         *
         * Dùng affiliate link ID để React
         * vẫn có một ID ổn định.
         */
        id:
          link.id,

        name:
          link.product_name,

        platform:
          link.platform,

        product_url:
          link.original_url,

        image_url:
          link.product_image_url ??
          null,

        price:
          link.product_price == null
            ? null
            : Number(
                link.product_price
              ),

        original_price:
          link.product_original_price ==
          null
            ? null
            : Number(
                link.product_original_price
              ),

        cashback_percent:
          link.cashback_percent == null
            ? null
            : Number(
                link.cashback_percent
              ),
      };
    }

    // =====================================================
    // 6. RESULT
    // =====================================================

    return NextResponse.json({
      success: true,

      link: {
        id:
          link.id,

        user_id:
          link.user_id,

        platform:
          link.platform,

        tracking_id:
          link.tracking_id,

        original_url:
          link.original_url,

        affiliate_url:
          link.affiliate_url,

        featured_product_id:
          link.featured_product_id,

        created_at:
          link.created_at,
      },

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