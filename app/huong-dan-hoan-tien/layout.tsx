import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hướng dẫn hoàn tiền Shopee, Lazada & TikTok Shop",

  description:
    "Hướng dẫn cách mua sắm hoàn tiền trên Shopee, Lazada và TikTok Shop tại Hoàn Tiền Sale: sao chép link, tạo link hoàn tiền, mua hàng, theo dõi đơn và nhận tiền hoàn.",

  keywords: [
    "hướng dẫn hoàn tiền",
    "cách mua hàng hoàn tiền",
    "hoàn tiền Shopee",
    "hoàn tiền Lazada",
    "hoàn tiền TikTok Shop",
    "mua sắm hoàn tiền",
  ],

  alternates: {
    canonical: "/huong-dan-hoan-tien",
  },

  openGraph: {
    title:
      "Hướng dẫn hoàn tiền Shopee, Lazada & TikTok Shop | Hoàn Tiền Sale",
    description:
      "Hướng dẫn từng bước tạo link mua sắm hoàn tiền trên Shopee, Lazada và TikTok Shop.",
    url: "/huong-dan-hoan-tien",
    type: "article",
  },
};

export default function HuongDanHoanTienLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}