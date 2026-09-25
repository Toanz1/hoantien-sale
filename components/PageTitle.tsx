"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TITLES: Record<string, string> = {
  "/": "Hoàn Tiền Sale - Mua sắm hoàn tiền",

  "/coupons": "Mã giảm giá | Hoàn Tiền Sale",
  "/dashboard": "Tổng quan | Hoàn Tiền Sale",
  "/link-history": "Lịch sử tạo link | Hoàn Tiền Sale",
  "/notifications": "Thông báo | Hoàn Tiền Sale",
  "/orders": "Đơn hàng | Hoàn Tiền Sale",
  "/profile": "Tài khoản | Hoàn Tiền Sale",
  "/referral": "Mời bạn bè | Hoàn Tiền Sale",
  "/san-pham": "Sản phẩm | Hoàn Tiền Sale",
  "/wallet": "Ví tiền | Hoàn Tiền Sale",
  "/withdrawals": "Rút tiền | Hoàn Tiền Sale",

  "/hoan-tien-shopee": "Hoàn tiền Shopee | Hoàn Tiền Sale",
  "/hoan-tien-lazada": "Hoàn tiền Lazada | Hoàn Tiền Sale",
  "/hoan-tien-tiktok-shop": "Hoàn tiền TikTok Shop | Hoàn Tiền Sale",

  "/login": "Đăng nhập | Hoàn Tiền Sale",
  "/register": "Đăng ký | Hoàn Tiền Sale",

  "/forgot-password": "Quên mật khẩu | Hoàn Tiền Sale",
  "/reset-password": "Đặt lại mật khẩu | Hoàn Tiền Sale",

  "/forgot-pin": "Quên mã PIN | Hoàn Tiền Sale",
  "/reset-pin": "Đặt lại mã PIN | Hoàn Tiền Sale",

  "/admin": "Quản trị | Hoàn Tiền Sale",
};

function getTitle(pathname: string) {
  // Route chính xác
  if (TITLES[pathname]) {
    return TITLES[pathname];
  }

  // Các trang con Admin
  if (pathname.startsWith("/admin/coupons")) {
    return "Quản lý voucher | Hoàn Tiền Sale";
  }

  if (pathname.startsWith("/admin/users")) {
    return "Quản lý người dùng | Hoàn Tiền Sale";
  }

  if (pathname.startsWith("/admin/products")) {
    return "Quản lý sản phẩm | Hoàn Tiền Sale";
  }

  if (pathname.startsWith("/admin/orders")) {
    return "Quản lý đơn hàng | Hoàn Tiền Sale";
  }

  if (pathname.startsWith("/admin/withdrawals")) {
    return "Quản lý rút tiền | Hoàn Tiền Sale";
  }

  if (pathname.startsWith("/admin")) {
    return "Quản trị | Hoàn Tiền Sale";
  }

  // Trang chi tiết sản phẩm
  if (pathname.startsWith("/san-pham/")) {
    return "Chi tiết sản phẩm | Hoàn Tiền Sale";
  }

  return "Hoàn Tiền Sale";
}

export default function PageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = getTitle(pathname);
  }, [pathname]);

  return null;
}