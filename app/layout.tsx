import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoàn Tiền Săn Sale",
  description: "Tạo link affiliate và theo dõi hoàn tiền."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}