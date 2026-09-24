import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { detectPlatform } from "@/lib/platform";
import { buildAffiliateUrl } from "@/lib/affiliate";

import {
  normalizeUrl,
  resolveShopeeShortLink,
  cleanShopeeAffiliateParams,
} from "@/lib/url";

type CreateLinkBody = {
  url?: unknown;
  featured_product_id?: unknown;
};

type FeaturedProduct = {
  id: string;
  platform: string;
  product_url: string;
  is_active: boolean;
};

/* =========================================================
   SUPABASE USER CLIENT
========================================================= */

function getUserClient(authHeader: string) {
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
          Authorization: authHeader,
        },
      },
    }
  );
}

/* =========================================================
   SUPABASE SERVER CLIENT
========================================================= */

function getAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
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
   MAIN
========================================================= */

export async function POST(request: Request) {
  try {
    // =====================================================
    // 1. BODY
    // =====================================================

    let body: CreateLinkBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Dữ liệu gửi lên không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const inputUrl =
      typeof body.url === "string"
        ? body.url.trim()
        : "";

    const featuredProductId =
      typeof body.featured_product_id ===
      "string"
        ? body.featured_product_id.trim()
        : "";

    /*
     * Nếu user tự dán link:
     * -> bắt buộc phải có URL.
     *
     * Nếu đi từ featured product:
     * -> URL thật sẽ lấy từ database.
     */
    if (!inputUrl && !featuredProductId) {
      return NextResponse.json(
        {
          error:
            "Vui lòng nhập link sản phẩm.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. AUTHORIZATION
    // =====================================================

    const authHeader =
      request.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader
        .toLowerCase()
        .startsWith("bearer ")
    ) {
      return NextResponse.json(
        {
          error:
            "Bạn cần đăng nhập để tạo link.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // 3. XÁC THỰC USER
    // =====================================================

    const userClient =
      getUserClient(authHeader);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error(
        "API /api/links auth error:",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Phiên đăng nhập không hợp lệ.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // 4. CHỌN URL NGUỒN
    // =====================================================

    let sourceUrl = inputUrl;

    let validFeaturedProductId:
      | string
      | null = null;

    let expectedPlatform:
      | string
      | null = null;

    /*
     * Nếu request xuất phát từ sản phẩm do Admin tạo,
     * KHÔNG tin product URL từ browser.
     *
     * Server đọc URL thật từ featured_products.
     */
    if (featuredProductId) {
      const adminClient =
        getAdminClient();

      const {
        data: featuredProduct,
        error: featuredError,
      } = await adminClient
        .from("featured_products")
        .select(
          `
            id,
            platform,
            product_url,
            is_active
          `
        )
        .eq("id", featuredProductId)
        .eq("is_active", true)
        .maybeSingle();

      if (featuredError) {
        console.error(
          "Load featured product error:",
          featuredError
        );

        return NextResponse.json(
          {
            error:
              "Không thể kiểm tra thông tin sản phẩm.",
          },
          { status: 500 }
        );
      }

      if (!featuredProduct) {
        return NextResponse.json(
          {
            error:
              "Sản phẩm không tồn tại hoặc đã ngừng hiển thị.",
          },
          { status: 404 }
        );
      }

      const product =
        featuredProduct as FeaturedProduct;

      if (!product.product_url?.trim()) {
        return NextResponse.json(
          {
            error:
              "Sản phẩm chưa có link mua hàng.",
          },
          { status: 400 }
        );
      }

      /*
       * URL do Admin lưu trong database
       * là nguồn dữ liệu đáng tin cậy.
       */
      sourceUrl =
        product.product_url.trim();

      validFeaturedProductId =
        product.id;

      expectedPlatform =
        product.platform
          ?.trim()
          .toLowerCase() || null;
    }

    // =====================================================
    // 5. CHUẨN HÓA URL
    // =====================================================

    let rawUrl: string;

    try {
      rawUrl =
        normalizeUrl(sourceUrl);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Link không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 6. NHẬN DIỆN PLATFORM
    // =====================================================

    let platform =
      detectPlatform(rawUrl);

    if (!platform) {
      return NextResponse.json(
        {
          error:
            "Chưa nhận diện được nền tảng. Hiện hỗ trợ Shopee, Lazada và TikTok Shop.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 7. KIỂM TRA PLATFORM FEATURED PRODUCT
    // =====================================================

    if (
      expectedPlatform &&
      platform !== expectedPlatform
    ) {
      console.error(
        "Featured product platform mismatch:",
        {
          featuredProductId:
            validFeaturedProductId,

          configuredPlatform:
            expectedPlatform,

          detectedPlatform:
            platform,
        }
      );

      return NextResponse.json(
        {
          error:
            "Link sản phẩm không khớp với sàn đã cấu hình trong Admin.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 8. SHOPEE
    // =====================================================

    if (platform === "shopee") {
      try {
        const parsedUrl =
          new URL(rawUrl);

        const hostname =
          parsedUrl.hostname.toLowerCase();

        /*
         * Resolve Shopee short link.
         */
        if (
          hostname === "s.shopee.vn" ||
          hostname === "vn.shp.ee"
        ) {
          rawUrl =
            await resolveShopeeShortLink(
              rawUrl
            );
        }

        /*
         * Xóa affiliate/tracking cũ
         * trước khi tạo tracking mới.
         */
        rawUrl =
          cleanShopeeAffiliateParams(
            rawUrl
          );

        /*
         * Sau khi resolve short link,
         * nhận diện lại platform.
         */
        const resolvedPlatform =
          detectPlatform(rawUrl);

        if (
          resolvedPlatform !== "shopee"
        ) {
          return NextResponse.json(
            {
              error:
                "Link Shopee không hợp lệ sau khi xử lý.",
            },
            { status: 400 }
          );
        }

        platform =
          resolvedPlatform;
      } catch (error) {
        console.error(
          "Shopee URL processing error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Không thể xử lý Shopee link.",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // 9. LAZADA
    // =====================================================

    if (platform === "lazada") {
      try {
        const parsedUrl =
          new URL(rawUrl);

        const hostname =
          parsedUrl.hostname.toLowerCase();

        /*
         * Không resolve Lazada short link.
         *
         * buildAffiliateUrl() sẽ xử lý:
         * sub_id1
         * laz_aff_id
         */
        if (
          hostname === "s.lazada.vn" ||
          hostname === "c.lazada.vn"
        ) {
          rawUrl =
            parsedUrl.toString();
        }
      } catch (error) {
        console.error(
          "Lazada URL processing error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Lazada URL không hợp lệ.",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // 10. TẠO AFFILIATE URL
    // =====================================================

    const affiliate =
      await buildAffiliateUrl(
        platform,
        rawUrl,
        user.id
      );

    console.log(
      "Creating affiliate link:",
      {
        userId: user.id,

        platform,

        trackingId:
          affiliate.trackingId,

        featuredProductId:
          validFeaturedProductId,

        hasAffiliateUrl:
          Boolean(
            affiliate.affiliateUrl
          ),
      }
    );

    // =====================================================
    // 11. AFFILIATE KHÔNG KHẢ DỤNG
    // =====================================================

    if (!affiliate.affiliateUrl) {
      return NextResponse.json(
        {
          error:
            affiliate.code ===
            "PRODUCT_NOT_ELIGIBLE"
              ? "Sản phẩm này hiện chưa có chương trình hoa hồng qua hệ thống."
              : affiliate.message ||
                "Không thể tạo affiliate link.",

          code:
            affiliate.code || null,
        },
        {
          status:
            affiliate.code ===
            "PRODUCT_NOT_ELIGIBLE"
              ? 422
              : 400,
        }
      );
    }

    // =====================================================
    // 12. LƯU AFFILIATE LINK
    // =====================================================

    /*
     * Vẫn insert bằng USER CLIENT.
     *
     * Như vậy RLS của affiliate_links vẫn kiểm soát
     * việc user chỉ tạo dữ liệu thuộc chính mình.
     *
     * Service role KHÔNG dùng để bypass việc này.
     */

    const {
      data,
      error: insertError,
    } = await userClient
      .from("affiliate_links")
      .insert({
        user_id: user.id,

        platform,

        original_url:
          rawUrl,

        affiliate_url:
          affiliate.affiliateUrl,

        tracking_id:
          affiliate.trackingId,

        featured_product_id:
          validFeaturedProductId,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "affiliate_links insert error:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "Không thể lưu link.",

          detail:
            insertError.message,

          code:
            insertError.code,
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 13. RESULT
    // =====================================================

    return NextResponse.json({
      success: true,
      link: data,
    });
  } catch (error) {
    console.error(
      "API /api/links error:",
      error
    );

    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error
        ? (
            error as {
              code?: string;
            }
          ).code
        : undefined;

    // =====================================================
    // TIKTOK / ACCESSTRADE
    // =====================================================

    if (
      errorCode ===
      "PRODUCT_NOT_ELIGIBLE"
    ) {
      return NextResponse.json(
        {
          error:
            "Sản phẩm này hiện chưa có chương trình hoa hồng qua hệ thống.",

          code:
            "PRODUCT_NOT_ELIGIBLE",
        },
        { status: 422 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SERVER_CONFIGURATION_ERROR"
    ) {
      return NextResponse.json(
        {
          error:
            "Server chưa được cấu hình đầy đủ.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra trên server.",
      },
      { status: 500 }
    );
  }
}