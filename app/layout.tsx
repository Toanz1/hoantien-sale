import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Footer from "@/components/Footer";
import PageTitle from "@/components/PageTitle";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hoàn Tiền Sale ",

  description:
    "Hoàn tiền khi mua sắm Shopee, Lazada và TikTok Shop",

  icons: {
    icon: "/platforms/hoantiensale.png",
    shortcut: "/platforms/hoantiensale.png",
    apple: "/platforms/hoantiensale.png",
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
        <PageTitle />

        {children}

        <Footer />
      </body>
    </html>
  );
}