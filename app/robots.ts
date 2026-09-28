import type { MetadataRoute } from "next";

const siteUrl = "https://hoantien-sale.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/profile/",
        "/wallet/",
        "/orders/",
        "/withdrawals/",
        "/notifications/",
        "/link-history/",
        "/reset-password/",
        "/reset-pin/",
      ],
    },

    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}