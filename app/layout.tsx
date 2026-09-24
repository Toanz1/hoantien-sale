import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer"; // <-- 1. Import Footer vào đây

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hoàn Tiền Sale - Mua sắm hoàn tiền",
  description: "Mua sắm hoàn tiền Shopee, Lazada, TikTok",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* Nội dung của từng trang sẽ hiển thị ở đây */}
        {children}

        {/* 2. Footer sẽ tự động xuất hiện ở dưới cùng của MỌI TRANG */}
        <Footer />
      </body>
    </html>
  );
}