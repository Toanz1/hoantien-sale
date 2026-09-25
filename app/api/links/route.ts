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

type ProductMetadata = {
  name: string | null;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
};

function getUserClient(authHeader: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("SERVER_CONFIGURATION_ERROR");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SERVER_CONFIGURATION_ERROR");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMetaContent(html: string, property: string): string | null {
  const escapedProperty = escapeRegExp(property);
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapedProperty}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapedProperty}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return null;
}

function getTitleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  return decodeHtml(match[1].replace(/\s+/g, " ").trim());
}

function parseMoney(value: string | null): number | null {
  if (!value) return null;

  let clean = value.replace(/[₫đ]/gi, "").replace(/\s+/g, "").trim();
  if (!clean) return null;

  if (/^\d{1,3}([.,]\d{3})+$/.test(clean)) {
    clean = clean.replace(/[.,]/g, "");
  } else {
    clean = clean.replace(/,/g, "");
  }

  const number = Number(clean);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

async function fetchShopeeMetadata(url: string): Promise<ProductMetadata> {
  const empty: ProductMetadata = {
    name: null,
    imageUrl: null,
    price: null,
    originalPrice: null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    let response: Response;

    try {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return empty;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) return empty;

    const html = await response.text();
    if (!html) return empty;

    let name =
      getMetaContent(html, "og:title") ||
      getMetaContent(html, "twitter:title") ||
      getTitleFromHtml(html);

    if (name) {
      name = name
        .replace(/\s*\|\s*Shopee\s+Việt\s+Nam\s*$/i, "")
        .replace(/\s*[-–]\s*Shopee\s+Việt\s+Nam\s*$/i, "")
        .trim();
      if (!name) name = null;
    }

    const imageUrl =
      getMetaContent(html, "og:image") || getMetaContent(html, "twitter:image");

    const priceText =
      getMetaContent(html, "product:price:amount") ||
      getMetaContent(html, "og:price:amount");
    let price = parseMoney(priceText);

    const originalPriceText =
      getMetaContent(html, "product:original_price:amount") ||
      getMetaContent(html, "product:original_price");
    let originalPrice = parseMoney(originalPriceText);

    if (price == null) {
      const pricePatterns = [
        /"price"\s*:\s*"([0-9.,]+)"/i,
        /"price"\s*:\s*([0-9.]+)/i,
        /"current_price"\s*:\s*"([0-9.,]+)"/i,
        /"current_price"\s*:\s*([0-9.]+)/i,
      ];
      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        const candidate = match?.[1] ? parseMoney(match[1]) : null;
        if (candidate != null && candidate > 0) {
          price = candidate;
          break;
        }
      }
    }

    if (originalPrice == null) {
      const originalPatterns = [
        /"price_before_discount"\s*:\s*"([0-9.,]+)"/i,
        /"price_before_discount"\s*:\s*([0-9.]+)/i,
        /"original_price"\s*:\s*"([0-9.,]+)"/i,
        /"original_price"\s*:\s*([0-9.]+)/i,
      ];
      for (const pattern of originalPatterns) {
        const match = html.match(pattern);
        const candidate = match?.[1] ? parseMoney(match[1]) : null;
        if (candidate != null && candidate > 0) {
          originalPrice = candidate;
          break;
        }
      }
    }

    if (price != null && originalPrice != null && originalPrice <= price) {
      originalPrice = null;
    }

    return {
      name,
      imageUrl: imageUrl?.trim() || null,
      price,
      originalPrice,
    };
  } catch (error) {
    console.warn(
      "Shopee metadata fetch failed:",
      error instanceof Error ? error.message : error
    );
    return empty;
  }
}

export async function POST(request: Request) {
  try {
    let body: CreateLinkBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
    }

    const inputUrl = typeof body.url === "string" ? body.url.trim() : "";
    const featuredProductId =
      typeof body.featured_product_id === "string" ? body.featured_product_id.trim() : "";

    if (!inputUrl && !featuredProductId) {
      return NextResponse.json({ error: "Vui lòng nhập link sản phẩm." }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để tạo link." }, { status: 401 });
    }

    const userClient = getUserClient(authHeader);
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("API /api/links auth error:", userError);
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }

    let sourceUrl = inputUrl;
    let validFeaturedProductId: string | null = null;
    let expectedPlatform: string | null = null;

    if (featuredProductId) {
      const adminClient = getAdminClient();
      const { data: featuredProduct, error: featuredError } = await adminClient
        .from("featured_products")
        .select("id, platform, product_url, is_active")
        .eq("id", featuredProductId)
        .eq("is_active", true)
        .maybeSingle();

      if (featuredError) {
        console.error("Load featured product error:", featuredError);
        return NextResponse.json(
          { error: "Không thể kiểm tra thông tin sản phẩm." },
          { status: 500 }
        );
      }

      if (!featuredProduct) {
        return NextResponse.json(
          { error: "Sản phẩm không tồn tại hoặc đã ngừng hiển thị." },
          { status: 404 }
        );
      }

      const product = featuredProduct as FeaturedProduct;
      if (!product.product_url?.trim()) {
        return NextResponse.json({ error: "Sản phẩm chưa có link mua hàng." }, { status: 400 });
      }

      sourceUrl = product.product_url.trim();
      validFeaturedProductId = product.id;
      expectedPlatform = product.platform?.trim().toLowerCase() || null;
    }

    let rawUrl: string;
    try {
      rawUrl = normalizeUrl(sourceUrl);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Link không hợp lệ." },
        { status: 400 }
      );
    }

    let platform = detectPlatform(rawUrl);
    if (!platform) {
      return NextResponse.json(
        { error: "Chưa nhận diện được nền tảng. Hiện hỗ trợ Shopee, Lazada và TikTok Shop." },
        { status: 400 }
      );
    }

    if (expectedPlatform && platform !== expectedPlatform) {
      console.error("Featured product platform mismatch:", {
        featuredProductId: validFeaturedProductId,
        configuredPlatform: expectedPlatform,
        detectedPlatform: platform,
      });
      return NextResponse.json(
        { error: "Link sản phẩm không khớp với sàn đã cấu hình trong Admin." },
        { status: 400 }
      );
    }

    let metadata: ProductMetadata = {
      name: null,
      imageUrl: null,
      price: null,
      originalPrice: null,
    };

    if (platform === "shopee") {
      try {
        const parsedUrl = new URL(rawUrl);
        const hostname = parsedUrl.hostname.toLowerCase();

        if (hostname === "s.shopee.vn" || hostname === "vn.shp.ee") {
          rawUrl = await resolveShopeeShortLink(rawUrl);
        }

        rawUrl = cleanShopeeAffiliateParams(rawUrl);
        const resolvedPlatform = detectPlatform(rawUrl);

        if (resolvedPlatform !== "shopee") {
          return NextResponse.json(
            { error: "Link Shopee không hợp lệ sau khi xử lý." },
            { status: 400 }
          );
        }

        platform = resolvedPlatform;
        if (!validFeaturedProductId) {
          metadata = await fetchShopeeMetadata(rawUrl);
        }
      } catch (error) {
        console.error("Shopee URL processing error:", error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Không thể xử lý Shopee link." },
          { status: 400 }
        );
      }
    }

    if (platform === "lazada") {
      try {
        new URL(rawUrl);
      } catch (error) {
        console.error("Lazada URL processing error:", error);
        return NextResponse.json({ error: "Lazada URL không hợp lệ." }, { status: 400 });
      }
    }

    const affiliate = await buildAffiliateUrl(platform, rawUrl, user.id);

    if (!affiliate.affiliateUrl) {
      return NextResponse.json(
        {
          error:
            affiliate.code === "PRODUCT_NOT_ELIGIBLE"
              ? "Sản phẩm này hiện chưa có chương trình hoa hồng qua hệ thống."
              : affiliate.message || "Không thể tạo affiliate link.",
          code: affiliate.code || null,
        },
        { status: affiliate.code === "PRODUCT_NOT_ELIGIBLE" ? 422 : 400 }
      );
    }

    const { data, error: insertError } = await userClient
      .from("affiliate_links")
      .insert({
        user_id: user.id,
        platform,
        original_url: rawUrl,
        affiliate_url: affiliate.affiliateUrl,
        tracking_id: affiliate.trackingId,
        featured_product_id: validFeaturedProductId,
        product_name: validFeaturedProductId ? null : metadata.name,
        product_image_url: validFeaturedProductId ? null : metadata.imageUrl,
        product_price: validFeaturedProductId ? null : metadata.price,
        product_original_price: validFeaturedProductId ? null : metadata.originalPrice,
        cashback_percent: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("affiliate_links insert error:", insertError);
      return NextResponse.json(
        { error: "Không thể lưu link.", detail: insertError.message, code: insertError.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, link: data });
  } catch (error) {
    console.error("API /api/links error:", error);

    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (errorCode === "PRODUCT_NOT_ELIGIBLE") {
      return NextResponse.json(
        {
          error: "Sản phẩm này hiện chưa có chương trình hoa hồng qua hệ thống.",
          code: "PRODUCT_NOT_ELIGIBLE",
        },
        { status: 422 }
      );
    }

    if (error instanceof Error && error.message === "SERVER_CONFIGURATION_ERROR") {
      return NextResponse.json({ error: "Server chưa được cấu hình đầy đủ." }, { status: 500 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Có lỗi xảy ra trên server." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xem lịch sử link." },
        { status: 401 }
      );
    }

    const userClient = getUserClient(authHeader);
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }

    const { data, error } = await userClient
      .from("affiliate_links")
      .select(
        "id, platform, original_url, affiliate_url, tracking_id, featured_product_id, product_name, product_image_url, product_price, product_original_price, cashback_percent, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("affiliate_links history error:", error);
      return NextResponse.json(
        { error: "Không thể tải lịch sử link.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, links: data ?? [] });
  } catch (error) {
    console.error("GET /api/links error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Có lỗi xảy ra trên server." },
      { status: 500 }
    );
  }
}
