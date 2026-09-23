import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { detectPlatform } from "@/lib/platform";
import { buildAffiliateUrl } from "@/lib/affiliate";

import {
  normalizeUrl,
  resolveShopeeShortLink,
  cleanShopeeAffiliateParams,
} from "@/lib/url";

export async function POST(request: Request) {
  try {
    // ==========================================
    // 1. Lấy URL người dùng nhập
    // ==========================================
    const body = await request.json();

    const inputUrl = String(body.url || "").trim();

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
    // 4. Xử lý riêng cho Shopee
    // ==========================================
    if (platform === "shopee") {
      try {
        const parsedUrl = new URL(rawUrl);
        const hostname = parsedUrl.hostname.toLowerCase();

        // Resolve Shopee short link
        if (
          hostname === "s.shopee.vn" ||
          hostname === "vn.shp.ee"
        ) {
          rawUrl = await resolveShopeeShortLink(rawUrl);
        }

        // Xóa tracking Affiliate cũ
        rawUrl = cleanShopeeAffiliateParams(rawUrl);

        console.log(
          "Shopee URL sau khi resolve:",
          rawUrl
        );

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
    // 5. Xử lý riêng cho Lazada
    // ==========================================
    if (platform === "lazada") {
      try {
        const parsedUrl = new URL(rawUrl);
        const hostname =
          parsedUrl.hostname.toLowerCase();

        /*
         * Lazada short link:
         * https://s.lazada.vn/...
         *
         * Không resolve trước.
         * Giữ nguyên URL do Lazada tạo.
         * buildAffiliateUrl() sẽ thêm:
         *
         * sub_id1 = trackingId
         * laz_aff_id = affiliateId
         */
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
    // 9. Tạo Affiliate URL
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
        originalUrl: rawUrl,
        trackingId: affiliate.trackingId,
        hasAffiliateUrl:
          Boolean(affiliate.affiliateUrl),
      }
    );

    // ==========================================
    // 10. Kiểm tra tạo Affiliate URL
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
    // 11. Lưu database
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
    // 12. Trả kết quả
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
        code: "PRODUCT_NOT_ELIGIBLE",
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