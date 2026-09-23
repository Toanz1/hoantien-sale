export type Platform =
  | "shopee"
  | "lazada"
  | "tiktok";

export function detectPlatform(
  rawUrl: string
): Platform | null {
  let host: string;

  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }

  // Shopee
  if (
  host === "shopee.vn" ||
  host === "s.shopee.vn" ||
  host === "vn.shp.ee" ||
  host.endsWith(".shopee.vn")
) {
  return "shopee";
}

  // Lazada
  if (
    host === "lazada.vn" ||
    host === "www.lazada.vn" ||
    host === "c.lazada.vn" ||
    host === "s.lazada.vn" ||
    host.endsWith(".lazada.vn")
  ) {
    return "lazada";
  }

  // TikTok Shop
  if (
    host === "tiktok.com" ||
    host === "www.tiktok.com" ||
    host.endsWith(".tiktok.com") ||
    host === "vt.tiktok.com"
  ) {
    return "tiktok";
  }

  // Một số short link TikTok
  if (host === "shorten.asia") {
    return "tiktok";
  }

  return null;
}