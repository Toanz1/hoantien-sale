export function normalizeUrl(rawUrl: string): string {
  const value = rawUrl.trim();

  if (!value) {
    throw new Error("URL rỗng.");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("URL không hợp lệ.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Chỉ hỗ trợ http:// hoặc https://.");
  }

  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  return url.toString();
}

export function isShopeeHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    return (
      host === "shopee.vn" ||
      host.endsWith(".shopee.vn") ||
      host === "s.shopee.vn" ||
      host === "vn.shp.ee"
    );
  } catch {
    return false;
  }
}

/**
 * Xóa các tham số tracking Affiliate cũ của Shopee.
 *
 * Không xóa các tham số sản phẩm như:
 * - extraParams
 * - model
 * - item
 * - shop
 * ...
 */
export function cleanShopeeAffiliateParams(
  url: string
): string {
  try {
    const parsed = new URL(url);

    if (!isShopeeHost(url)) {
      return url;
    }

    const affiliateParams = [
      "affiliate_id",
      "sub_id",
      "mmp_pid",
      "uls_trackid",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ];

    for (const param of affiliateParams) {
      parsed.searchParams.delete(param);
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Resolve Shopee short link.
 *
 * Ví dụ:
 *
 * https://s.shopee.vn/xxxxx
 *        ↓
 * https://shopee.vn/product...
 *
 * hoặc:
 *
 * https://vn.shp.ee/xxxxx
 *        ↓
 * https://shopee.vn/product...
 */
export async function resolveShopeeShortLink(
  inputUrl: string
): Promise<string> {
  let currentUrl = normalizeUrl(inputUrl);

  for (let i = 0; i < 5; i++) {
    const parsed = new URL(currentUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Đã tới URL Shopee đầy đủ
    if (
      hostname === "shopee.vn" ||
      hostname.endsWith(".shopee.vn")
    ) {
      return currentUrl;
    }

    // Chỉ xử lý các Shopee short link
    if (
      hostname !== "s.shopee.vn" &&
      hostname !== "vn.shp.ee"
    ) {
      throw new Error(
        "Short link Shopee chuyển tới địa chỉ không được hỗ trợ."
      );
    }

    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      },
      cache: "no-store",
    });

    const location =
      response.headers.get("location");

    if (!location) {
      throw new Error(
        "Không thể xác định link đích của Shopee short link."
      );
    }

    const nextUrl = normalizeUrl(
      new URL(
        location,
        currentUrl
      ).toString()
    );

    const nextHostname =
      new URL(nextUrl).hostname.toLowerCase();

    // Nếu redirect trực tiếp tới Shopee
    if (
      nextHostname === "shopee.vn" ||
      nextHostname.endsWith(".shopee.vn")
    ) {
      return nextUrl;
    }

    // Nếu vẫn là short link thì tiếp tục vòng lặp
    currentUrl = nextUrl;
  }

  throw new Error(
    "Shopee short link chuyển hướng quá nhiều lần."
  );
}