import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoàn tiền Shopee",

  description:
    "Hướng dẫn hoàn tiền Shopee tại Hoàn Tiền Sale. Tạo link mua hàng, theo dõi đơn và xem các lưu ý giúp đơn được ghi nhận hoàn tiền.",

  keywords: [
    "hoàn tiền Shopee",
    "Shopee hoàn tiền",
    "cashback Shopee",
    "mua Shopee hoàn tiền",
    "cách hoàn tiền Shopee",
  ],

  alternates: {
    canonical: "/hoan-tien-shopee",
  },

  openGraph: {
    title: "Hoàn tiền Shopee | Hoàn Tiền Sale",
    description:
      "Hướng dẫn tạo link mua Shopee và các lưu ý khi nhận hoàn tiền.",
    url: "/hoan-tien-shopee",
    type: "website",
  },
};

export default function ShopeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}