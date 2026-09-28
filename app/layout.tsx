import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
});

const siteUrl = "https://hoantien-sale.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  verification: {
    google: "kvJRvgYA3W2A0v6rIcyVRA6mnbsM2uUGYL_7fZewgBI",
  },

  title: {
    default: "Hoàn Tiền Sale - Mua sắm hoàn tiền",
    template: "%s | Hoàn Tiền Sale",
  },

  description:
    "Tạo link mua sắm hoàn tiền khi mua hàng trên Shopee, Lazada và TikTok Shop. Theo dõi đơn hàng, tiền hoàn và rút tiền tại Hoàn Tiền Sale.",

  applicationName: "Hoàn Tiền Sale",

  keywords: [
    "Hoàn Tiền Sale",
    "hoàn tiền",
    "hoàn tiền Shopee",
    "hoàn tiền Lazada",
    "hoàn tiền TikTok Shop",
    "mua sắm hoàn tiền",
    "cashback Shopee",
    "cashback Lazada",
    "cashback TikTok Shop",
  ],

  authors: [{ name: "Hoàn Tiền Sale" }],
  creator: "Hoàn Tiền Sale",
  publisher: "Hoàn Tiền Sale",

  icons: {
    icon: "/platforms/hoantiensale.png",
    shortcut: "/platforms/hoantiensale.png",
    apple: "/platforms/hoantiensale.png",
  },

  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "Hoàn Tiền Sale",
    title: "Hoàn Tiền Sale - Mua sắm hoàn tiền",
    description:
      "Tạo link mua sắm hoàn tiền Shopee, Lazada và TikTok Shop. Theo dõi đơn hàng và nhận tiền hoàn tại Hoàn Tiền Sale.",
    images: [
      {
        url: "/platforms/hoantiensale.png",
        width: 512,
        height: 512,
        alt: "Hoàn Tiền Sale",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Hoàn Tiền Sale - Mua sắm hoàn tiền",
    description:
      "Tạo link mua sắm hoàn tiền Shopee, Lazada và TikTok Shop.",
    images: ["/platforms/hoantiensale.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        
      </body>
    </html>
  );
}