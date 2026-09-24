import Link from "next/link";

const items = [
  {
    icon: "◷",
    title: "Lịch sử tạo link",
    description: "Xem lại các link sản phẩm đã kiểm tra",
    label: "Xem lịch sử",
    href: "/link-history",
  },
  {
    icon: "🎟",
    title: "Mã giảm giá",
    description: "Mã giảm giá Shopee, Lazada, TikTok Shop hôm nay",
    label: "Xem mã",
    href: "/coupons",
  },
  {
    icon: "▤",
    title: "Blog",
    description: "Tin tức săn sale, mã giảm giá và cách dùng hoàn tiền",
    label: "Đọc bài viết",
    href: "/blog",
  },
  {
    icon: "♟",
    title: "Nhóm săn sale",
    description: "Nhóm săn sale nhận mã giảm giá và deal hấp dẫn",
    label: "Tham gia ngay",
    href: "/sale-group",
  },
  {
    icon: "⚡",
    title: "Deal 1K, 9K, 29K",
    description: "Cập nhật deal Flash Sale hấp dẫn mỗi ngày",
    label: "Xem deal",
    href: "/deals",
  },
  {
    icon: "♧",
    title: "Hỗ trợ",
    description: "Liên hệ khi cần hỗ trợ đơn hàng và hoàn tiền",
    label: "Liên hệ ngay",
    href: "/support",
  },
];

export default function QuickFeatures() {
  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex min-h-[235px] flex-col rounded-[20px] border border-emerald-200 bg-emerald-50/30 p-7 transition duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-100/60"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-black text-emerald-600">
                {item.icon}
              </div>

              <h3 className="mt-5 text-2xl font-black tracking-tight text-gray-950">
                {item.title}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                {item.description}
              </p>

              <div className="mt-auto pt-5">
                <span className="inline-flex items-center gap-3 text-sm font-black text-emerald-600 transition group-hover:gap-4 group-hover:text-emerald-700">
                  {item.label}
                  <span className="text-xl">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}