import crypto from "node:crypto";

import type { Platform } from "./platform";

type AffiliateErrorCode =
  | "PRODUCT_NOT_ELIGIBLE"
  | "AFFILIATE_API_ERROR";

type AffiliateResult = {
  trackingId: string;
  affiliateUrl: string | null;
  message: string | null;
  code?: AffiliateErrorCode;
  shortUrl?: string | null;
  productId?: string;
  resolvedUrl?: string;
};

function createTrackingId(
  userId: string | null,
  url: string
) {
  const secret =
  process.env.TRACKING_SECRET;

if (!secret) {
  throw new Error(
    "TRACKING_SECRET chưa được cấu hình."
  );
}

  return crypto
    .createHmac("sha256", secret)
    .update(
      `${userId ?? "guest"}|${url}|${Date.now()}`
    )
    .digest("hex")
    .slice(0, 16);
}

// ======================================================
// SHOPEE
// ======================================================

function buildShopeeAffiliateUrl(
  originalUrl: string,
  trackingId: string
) {
  const affiliateId =
    process.env.SHOPEE_AFFILIATE_ID;

  if (!affiliateId) {
    throw new Error(
      "SHOPEE_AFFILIATE_ID chưa được cấu hình."
    );
  }

  const params = new URLSearchParams({
    origin_link: originalUrl,
    affiliate_id: affiliateId,
    sub_id: trackingId,
  });

  return `https://s.shopee.vn/an_redir?${params.toString()}`;
}

// ======================================================
// LAZADA
// ======================================================

function buildLazadaAffiliateUrl(
  originalUrl: string,
  trackingId: string
) {
  const affiliateId =
    process.env.LAZADA_AFFILIATE_ID;

  if (!affiliateId) {
    throw new Error(
      "LAZADA_AFFILIATE_ID chưa được cấu hình."
    );
  }

  let url: URL;

  try {
    url = new URL(originalUrl);
  } catch {
    throw new Error(
      "Lazada URL không hợp lệ."
    );
  }

  const hostname =
    url.hostname.toLowerCase();

  if (
    hostname !== "s.lazada.vn" &&
    hostname !== "c.lazada.vn" &&
    hostname !== "lazada.vn" &&
    !hostname.endsWith(".lazada.vn")
  ) {
    throw new Error(
      "Đây không phải Lazada URL được hỗ trợ."
    );
  }

  url.searchParams.set(
    "sub_id1",
    trackingId
  );

  url.searchParams.set(
    "laz_aff_id",
    affiliateId
  );

  return url.toString();
}

// ======================================================
// TIKTOK PRODUCT ID
// ======================================================

function extractTikTokProductId(
  urlString: string
) {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    throw new Error(
      "TikTok URL không hợp lệ."
    );
  }

  // /view/product/123456
  const viewProductMatch =
    url.pathname.match(
      /\/view\/product\/(\d+)/i
    );

  if (viewProductMatch?.[1]) {
    return viewProductMatch[1];
  }

  // /pdp/123456
  const pdpMatch =
    url.pathname.match(
      /\/pdp\/(\d+)/i
    );

  if (pdpMatch?.[1]) {
    return pdpMatch[1];
  }

  // ?product_id=123456
  const productId =
    url.searchParams.get(
      "product_id"
    );

  if (
    productId &&
    /^\d+$/.test(productId)
  ) {
    return productId;
  }

  throw new Error(
    "Không tìm thấy TikTok Shop product ID trong URL."
  );
}

// ======================================================
// RESOLVE TIKTOK URL
// ======================================================

async function resolveTikTokUrl(
  inputUrl: string
) {
  let url: URL;

  try {
    url = new URL(inputUrl);
  } catch {
    throw new Error(
      "TikTok URL không hợp lệ."
    );
  }

  const hostname =
    url.hostname.toLowerCase();

  // URL đã là product URL
  // thì không cần resolve
  if (
    hostname === "www.tiktok.com" ||
    hostname === "tiktok.com" ||
    hostname.endsWith(".tiktok.com")
  ) {
    if (
      /\/(view\/product|pdp)\//i.test(
        url.pathname
      )
    ) {
      return url.toString();
    }
  }

  const response = await fetch(
    inputUrl,
    {
      method: "GET",
      redirect: "follow",

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      },

      cache: "no-store",
    }
  );

  const finalUrl =
    response.url;

  if (!finalUrl) {
    throw new Error(
      "Không thể xác định TikTok URL đích."
    );
  }

  return finalUrl;
}

// ======================================================
// ACCESSTRADE - TIKTOK
// ======================================================

async function buildAccessTradeTikTokLink(
  originalUrl: string,
  trackingId: string
) {
  const apiKey =
    process.env.ACCESSTRADE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ACCESSTRADE_API_KEY chưa được cấu hình."
    );
  }

  // Resolve TikTok short/share URL
  const resolvedUrl =
    await resolveTikTokUrl(
      originalUrl
    );

  // Lấy product ID
  const productId =
    extractTikTokProductId(
      resolvedUrl
    );

  const response =
    await fetch(
      "https://api.accesstrade.vn/v1/tiktokshop_product_feeds/create_link",
      {
        method: "POST",

        headers: {
          accept:
            "application/json",

          authorization:
            `Token ${apiKey}`,

          "content-type":
            "application/json",
        },

        body: JSON.stringify({
          product_url:
            resolvedUrl,

          product_id:
            productId,

          // Tracking riêng
          // của Hoàn Tiền Săn Sale
          sub1: trackingId,
        }),

        cache: "no-store",
      }
    );

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      `ACCESSTRADE trả về dữ liệu không hợp lệ. HTTP ${response.status}.`
    );
  }

  // ==================================================
  // HTTP ERROR
  // ==================================================

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `ACCESSTRADE API lỗi HTTP ${response.status}.`
    );
  }

  // ==================================================
  // PRODUCT NOT ELIGIBLE
  // ==================================================

  if (!data?.status) {
    const error =
      new Error(
        data?.message ||
          "Sản phẩm này hiện chưa đủ điều kiện để tạo link Affiliate."
      );

    (
      error as Error & {
        code?: AffiliateErrorCode;
      }
    ).code =
      "PRODUCT_NOT_ELIGIBLE";

    throw error;
  }

  // ==================================================
  // AFFILIATE URL
  // ==================================================

  const affiliateUrl =
    data?.data?.aff_url;

  const shortUrl =
    data?.data?.aff_short_url ??
    null;

  if (!affiliateUrl) {
    throw new Error(
      "ACCESSTRADE không trả về affiliate URL."
    );
  }

  return {
    affiliateUrl,
    shortUrl,
    productId,
    resolvedUrl,
  };
}

// ======================================================
// MAIN
// ======================================================

export async function buildAffiliateUrl(
  platform: Platform,
  originalUrl: string,
  userId: string | null
): Promise<AffiliateResult> {
  const trackingId =
    createTrackingId(
      userId,
      originalUrl
    );

  // ====================================================
  // SHOPEE
  // ====================================================

  if (platform === "shopee") {
    try {
      const affiliateUrl =
        buildShopeeAffiliateUrl(
          originalUrl,
          trackingId
        );

      return {
        trackingId,
        affiliateUrl,
        message: null,
      };
    } catch (error) {
      console.error(
        "Shopee affiliate error:",
        error
      );

      return {
        trackingId,
        affiliateUrl: null,
        message:
          error instanceof Error
            ? error.message
            : "Shopee Affiliate ID chưa được cấu hình.",
      };
    }
  }

  // ====================================================
  // LAZADA
  // ====================================================

  if (platform === "lazada") {
    try {
      const affiliateUrl =
        buildLazadaAffiliateUrl(
          originalUrl,
          trackingId
        );

      return {
        trackingId,
        affiliateUrl,
        message: null,
      };
    } catch (error) {
      console.error(
        "Lazada affiliate error:",
        error
      );

      return {
        trackingId,
        affiliateUrl: null,
        message:
          error instanceof Error
            ? error.message
            : "Không thể tạo Lazada affiliate link.",
      };
    }
  }

  // ====================================================
  // TIKTOK
  // ====================================================

  if (platform === "tiktok") {
    try {
      const result =
        await buildAccessTradeTikTokLink(
          originalUrl,
          trackingId
        );

      return {
        trackingId,

        affiliateUrl:
          result.affiliateUrl,

        message: null,

        shortUrl:
          result.shortUrl,

        productId:
          result.productId,

        resolvedUrl:
          result.resolvedUrl,
      };
    } catch (error) {
      console.error(
        "ACCESSTRADE TikTok error:",
        error
      );

      const errorCode =
        error &&
        typeof error === "object" &&
        "code" in error
          ? (
              error as {
                code?: AffiliateErrorCode;
              }
            ).code
          : undefined;

      return {
        trackingId,

        affiliateUrl: null,

        message:
          error instanceof Error
            ? error.message
            : "Không thể tạo TikTok affiliate link.",

        code: errorCode,
      };
    }
  }

  // ====================================================
  // DEFAULT
  // ====================================================

  return {
    trackingId,
    affiliateUrl: null,
    message:
      "Affiliate adapter chưa được cấu hình cho nền tảng này.",
  };
}