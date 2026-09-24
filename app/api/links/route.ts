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

export async function POST(request: Request) {
  try {
    // ==========================================
    // 1. Lấy dữ liệu người dùng gửi lên
    // ==========================================
    let body: CreateLinkBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Dữ liệu gửi lên không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const inputUrl = String(body.url || "").trim();

    const featuredProductId =
      typeof body.featured_product_id === "string"
        ? body.featured_product_id.trim() || null
        : null;

    if (!inputUrl) {
      return NextResponse.json(
        {
          error: "Vui lòng nhập link sản phẩm.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 2. Chuẩn hóa URL
    // ==========================================
    let rawUrl: string;

    try {
      rawUrl = normalizeUrl(inputUrl);
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

    // ==========================================
    // 3. Nhận diện platform
    // ==========================================
    let platform = detectPlatform(rawUrl);

    if (!platform) {
      return NextResponse.json(
        {
          error:
            "Chưa nhận diện được nền tảng. Hiện hỗ trợ Shopee, Lazada và TikTok Shop.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. Xử lý riêng Shopee
    // ==========================================
    if (platform === "shopee") {
      try {
        const parsedUrl = new URL(rawUrl);
        const hostname = parsedUrl.hostname.toLowerCase();

        if (
          hostname === "s.shopee.vn" ||
          hostname === "vn.shp.ee"
        ) {
          rawUrl = await resolveShopeeShortLink(rawUrl);
        }

        rawUrl = cleanShopeeAffiliateParams(rawUrl);

        platform = detectPlatform(rawUrl);

        if (!platform) {
          return NextResponse.json(
            {
              error:
                "Không xác định được nền tảng sau khi xử lý link.",
            },
            { status: 400 }
          );
        }
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

    // ==========================================
    // 5. Xử lý riêng Lazada
    // ==========================================
    if (platform === "lazada") {
      try {
        const parsedUrl = new URL(rawUrl);
        const hostname =
          parsedUrl.hostname.toLowerCase();

        if (
          hostname === "s.lazada.vn" ||
          hostname === "c.lazada.vn"
        ) {
          rawUrl = parsedUrl.toString();
        }
      } catch (error) {
        console.error(
          "Lazada URL processing error:",
          error
        );

        return NextResponse.json(
          {
            error: "Lazada URL không hợp lệ.",
          },
          { status: 400 }
        );
      }
    }

    // ==========================================
    // 6. Lấy Authorization
    // ==========================================
    const authHeader =
      request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "Bạn cần đăng nhập để tạo link.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 7. Supabase client theo user token
    // ==========================================
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "API /api/links: Missing Supabase environment variables"
      );

      return NextResponse.json(
        {
          error:
            "Server chưa được cấu hình đầy đủ.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
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

    // ==========================================
    // 8. Xác thực user
    // ==========================================
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Auth error:",
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

    // ==========================================
    // 9. Nếu link đến từ sản phẩm Admin,
    //    xác thực sản phẩm tồn tại + đang hiển thị
    // ==========================================
    let validFeaturedProductId: string | null = null;

    if (featuredProductId) {
      const { data: featuredProduct, error } =
        await supabase
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

      if (error) {
        console.error(
          "Load featured product error:",
          error
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

      /*
       * Không tin platform do client gửi.
       * Kiểm tra sản phẩm Admin có cùng sàn với URL
       * đang được xử lý hay không.
       */
      const productPlatform = String(
        featuredProduct.platform || ""
      ).toLowerCase();

      if (productPlatform !== platform) {
        return NextResponse.json(
          {
            error:
              "Link sản phẩm không khớp với sàn đã cấu hình.",
          },
          { status: 400 }
        );
      }

      validFeaturedProductId =
        featuredProduct.id;
    }

    // ==========================================
    // 10. Tạo Affiliate URL
    // ==========================================
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
          Boolean(affiliate.affiliateUrl),
      }
    );

    // ==========================================
    // 11. Kiểm tra Affiliate URL
    // ==========================================
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

    // ==========================================
    // 12. Lưu database
    // ==========================================
    const { data, error } =
      await supabase
        .from("affiliate_links")
        .insert({
          user_id: user.id,
          platform,
          original_url: rawUrl,
          affiliate_url:
            affiliate.affiliateUrl,
          tracking_id:
            affiliate.trackingId,

          // NULL nếu user tự dán link.
          // Có ID nếu user bấm sản phẩm Admin.
          featured_product_id:
            validFeaturedProductId,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "affiliate_links insert error:",
        error
      );

      return NextResponse.json(
        {
          error: "Không thể lưu link.",
          detail: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 13. Trả kết quả
    // ==========================================
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
        ? (error as { code?: string }).code
        : undefined;

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