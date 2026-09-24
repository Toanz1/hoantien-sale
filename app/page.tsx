import Link from "next/link";

import LinkForm from "@/components/LinkForm";
import HomeAuthNav from "@/components/HomeAuthNav";
import FeaturedProducts from "@/components/FeaturedProducts";
import BrandLogo from "@/components/BrandLogo";
const platforms = [
  {
    name: "Shopee",
    logo: "/platforms/shopee.png",
    description: "Mua sắm & nhận hoàn tiền",
    style:
      "border-orange-100 bg-orange-50",
  },
  {
    name: "Lazada",
    logo: "/platforms/lazada.png",
    description: "Deal hot mỗi ngày",
    style:
      "border-blue-100 bg-blue-50",
  },
  {
    name: "TikTok Shop",
    logo: "/platforms/tiktok-shop.png",
    description: "Săn sale trên TikTok",
    style:
      "border-gray-200 bg-gray-50",
  },
];

const steps = [
  {
    number: "01",
    title: "Sao chép link",
    description:
      "Chọn sản phẩm bạn muốn mua trên Shopee, Lazada hoặc TikTok Shop và sao chép link.",
  },
  {
    number: "02",
    title: "Tạo link hoàn tiền",
    description:
      "Dán link vào Hoàn Tiền Sale. Hệ thống tạo link mua hàng có tracking riêng của bạn.",
  },
  {
    number: "03",
    title: "Mua hàng",
    description:
      "Đi đến sàn bằng nút Mua ngay và hoàn tất đơn hàng như bình thường.",
  },
  {
    number: "04",
    title: "Nhận tiền hoàn",
    description:
      "Khi đơn được đối soát và duyệt, tiền hoàn sẽ được ghi nhận vào ví.",
  },
];

export default function Home() {
  return (
    <main
      id="top"
      className="min-h-screen bg-[#f7f8fa] text-gray-900"
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <BrandLogo />

          <div className="hidden whitespace-nowrap text-sm font-bold text-gray-700 md:block">
            Mua sắm hoàn tiền
          </div>

          <div className="flex justify-end">
            <HomeAuthNav />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 md:pb-16 md:pt-16">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Hoàn tiền khi mua sắm online
            </div>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Link bạn đã định mua,
              <span className="block text-emerald-500">
                giờ có thể nhận hoàn tiền.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base md:text-lg">
              Dán link sản phẩm từ Shopee, Lazada hoặc TikTok
              Shop. Hệ thống tạo link mua hàng riêng để ghi
              nhận đơn và tiền hoàn của bạn.
            </p>
          </div>

          {/* MAIN SEARCH */}
          <div className="mx-auto mt-9 max-w-4xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <div className="text-sm font-black">
                  Dán link sản phẩm
                </div>

                <div className="mt-0.5 text-xs text-gray-400">
                  Hỗ trợ Shopee · Lazada · TikTok Shop
                </div>
              </div>

              <div className="hidden items-center gap-1.5 text-xs font-semibold text-gray-400 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Sẵn sàng
              </div>
            </div>

            <LinkForm />

            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-gray-400">
              <span>✓ Miễn phí sử dụng</span>
              <span>✓ Tracking riêng</span>
              <span>✓ Theo dõi đơn hàng</span>
              <span>✓ Rút tiền về ngân hàng</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
<section className="border-y border-gray-200 bg-[#f7f8fa]">
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div className="grid gap-3 sm:grid-cols-3">
      {platforms.map((platform) => (
        <div
          key={platform.name}
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {/* LOGO */}
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2.5 ${platform.style}`}
          >
            <img
              src={platform.logo}
              alt={`${platform.name} logo`}
              className="h-full w-full object-contain"
            />
          </div>

          {/* TEXT */}
          <div className="min-w-0">
            <div className="font-black text-gray-950">
              {platform.name}
            </div>

            <div className="mt-1 truncate text-xs text-gray-500">
              {platform.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

{/* FEATURED PRODUCTS */}

      <FeaturedProducts />
      {/* QUICK ACCESS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
            Quản lý hoàn tiền
          </div>

          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Mọi thứ ở một nơi
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/orders"
            className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl">
              📦
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-lg font-black">
                Đơn hàng
              </h3>

              <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-900">
                →
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Kiểm tra đơn đang xử lý, đã duyệt và số tiền
              hoàn của từng đơn.
            </p>
          </Link>

          <Link
            href="/wallet"
            className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
              💰
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-lg font-black">
                Ví của bạn
              </h3>

              <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-900">
                →
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Theo dõi số dư, tiền hoàn và yêu cầu rút tiền
              về tài khoản ngân hàng.
            </p>
          </Link>

          <Link
            href="/referral"
            className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl">
              🎁
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-lg font-black">
                Mời bạn bè
              </h3>

              <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-900">
                →
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Chia sẻ mã giới thiệu, mời bạn bè tham gia và theo
              dõi hoa hồng giới thiệu của bạn.
            </p>
          </Link>

          <Link
            href="/profile"
            className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl">
              👤
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-lg font-black">
                Tài khoản
              </h3>

              <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-900">
                →
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Quản lý thông tin cá nhân và thông tin nhận
              tiền của bạn.
            </p>
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              Cách hoạt động
            </div>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Mua như bình thường,
              <br className="sm:hidden" /> nhận thêm tiền hoàn
            </h2>

            <p className="mt-4 text-sm leading-6 text-gray-500">
              Không cần thay đổi cách mua sắm của bạn. Chỉ
              cần bắt đầu đơn hàng từ link được tạo trên hệ
              thống.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-3xl border border-gray-200 bg-[#fafafa] p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white">
                    {step.number}
                  </div>

                  <div className="ml-4 h-px flex-1 bg-gray-200" />
                </div>

                <h3 className="mt-6 text-lg font-black">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICE */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-[32px] bg-gray-950 px-6 py-10 text-white sm:px-10 md:flex md:items-center md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">
              Mẹo quan trọng
            </div>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Luôn bắt đầu mua hàng từ link hoàn tiền.
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Sau khi tạo link, hãy dùng nút Mua ngay để đi
              tới sàn. Điều này giúp hệ thống có cơ sở ghi
              nhận đơn hàng của bạn.
            </p>
          </div>

          <a
            href="#top"
            className="mt-6 inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white transition hover:bg-emerald-400 md:mt-0"
          >
            Dán link sản phẩm ↑
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-black text-gray-900">
              Hoàn Tiền Sale
            </div>

            <div className="mt-1 text-xs">
              © {new Date().getFullYear()} Hoàn Tiền Sale
            </div>
          </div>

          <div className="text-xs font-medium text-gray-400">
            Mua sắm thông minh · Nhận thêm hoàn tiền
          </div>
        </div>
      </footer>
    </main>
  );
}