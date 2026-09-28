import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hoàn tiền TikTok Shop",

  description:
    "Hướng dẫn hoàn tiền TikTok Shop tại Hoàn Tiền Sale. Tạo link mua hàng, theo dõi đơn và xem các lưu ý khi mua sắm nhận hoàn tiền.",

  keywords: [
    "hoàn tiền TikTok Shop",
    "TikTok Shop hoàn tiền",
    "cashback TikTok Shop",
    "mua TikTok hoàn tiền",
    "cách hoàn tiền TikTok Shop",
  ],

  alternates: {
    canonical: "/hoan-tien-tiktok-shop",
  },

  openGraph: {
    title: "Hoàn tiền TikTok Shop | Hoàn Tiền Sale",
    description:
      "Hướng dẫn tạo link mua TikTok Shop và các lưu ý khi nhận hoàn tiền.",
    url: "/hoan-tien-tiktok-shop",
    type: "website",
  },
};

export default function TikTokShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}