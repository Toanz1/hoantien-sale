import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoàn tiền Lazada",

  description:
    "Hướng dẫn hoàn tiền Lazada tại Hoàn Tiền Sale. Tạo link mua hàng Lazada, theo dõi đơn và xem các lưu ý để đơn được ghi nhận hoàn tiền.",

  keywords: [
    "hoàn tiền Lazada",
    "Lazada hoàn tiền",
    "cashback Lazada",
    "mua Lazada hoàn tiền",
    "cách hoàn tiền Lazada",
  ],

  alternates: {
    canonical: "/hoan-tien-lazada",
  },

  openGraph: {
    title: "Hoàn tiền Lazada | Hoàn Tiền Sale",
    description:
      "Hướng dẫn tạo link mua Lazada và các lưu ý khi nhận hoàn tiền.",
    url: "/hoan-tien-lazada",
    type: "website",
  },
};

export default function LazadaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}