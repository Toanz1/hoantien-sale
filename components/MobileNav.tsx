"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: "⌂",
  },
  {
    href: "/orders",
    label: "Đơn hàng",
    icon: "▣",
  },
  {
    href: "/wallet",
    label: "Ví tiền",
    icon: "◈",
  },
  {
    href: "/",
    label: "Mua sắm",
    icon: "＋",
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200/80 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl transition ${
                active
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center text-lg font-black ${
                  active ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {item.icon}
              </span>

              <span
                className={`mt-0.5 text-[10px] font-bold ${
                  active
                    ? "text-emerald-600"
                    : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}