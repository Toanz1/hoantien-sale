import type { Metadata } from "next";
import Link from "next/link";

import LinkForm from "@/components/LinkForm";
import HomeAuthNav from "@/components/HomeAuthNav";
import FeaturedProducts from "@/components/FeaturedProducts";
import BrandLogo from "@/components/BrandLogo";
import HomeCoupons from "@/components/HomeCoupons";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";

export const metadata: Metadata = {
  title: {
    absolute: "Hoàn Tiền Sale - Mua sắm hoàn tiền",
  },

  description:
    "Tạo link mua sắm hoàn tiền Shopee, Lazada và TikTok Shop. Theo dõi đơn hàng, tiền hoàn và rút tiền tại Hoàn Tiền Sale.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Hoàn Tiền Sale - Mua sắm hoàn tiền",
    description:
      "Tạo link mua sắm hoàn tiền Shopee, Lazada và TikTok Shop.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      {/* STRUCTURED DATA */}
      <OrganizationJsonLd />

      <main
        id="top"
        className="min-h-screen bg-[#f7f8fa] text-gray-900"
      >
        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
            {/* LOGO MOBILE */}
            <Link
              href="/"
              className="flex shrink-0 items-center sm:hidden"
              aria-label="Hoàn Tiền Sale"
            >
              <img
                src="/platforms/hoantiensale.png"
                alt="Hoàn Tiền Sale"
                className="h-12 w-16 object-contain object-left"
              />
            </Link>

            {/* LOGO TABLET / DESKTOP */}
            <div className="hidden min-w-0 sm:block">
              <BrandLogo />
            </div>

            {/* AUTH */}
            <div className="ml-auto flex shrink-0 justify-end">
              <HomeAuthNav />
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden bg-white pb-5 pt-6 sm:py-12">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Hoàn tiền khi mua sắm online
              </div>

              <h1 className="mx-auto mt-3 max-w-2xl text-[30px] font-black leading-[1.08] tracking-tight sm:mt-4 sm:text-4xl sm:leading-tight md:text-5xl">
                Link bạn đã định mua,{" "}
                <span className="text-emerald-500">
                  giờ có thể nhận hoàn tiền.
                </span>
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-[13px] leading-5 text-gray-500 sm:text-sm sm:leading-6">
                Dán link sản phẩm từ Shopee, Lazada hoặc TikTok Shop để tạo
                link mua hàng ghi nhận tiền hoàn.
              </p>
            </div>

            {/* MAIN LINK FORM */}
            <div className="mx-auto mt-5 max-w-3xl sm:mt-6">
              <LinkForm />

              <div className="mx-auto mt-3 grid max-w-sm grid-cols-2 gap-x-3 gap-y-2 px-1 text-left text-[11px] font-semibold text-gray-400 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-1 sm:px-0 sm:text-center">
                <span>✓ Miễn phí</span>
                <span>✓ Tracking riêng</span>
                <span>✓ Theo dõi đơn</span>
                <span>✓ Rút tiền ngân hàng</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM SEO LINKS */}
        <section className="border-y border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
              <Link
                href="/hoan-tien-shopee"
                className="flex min-h-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-[11px] font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
              >
                Hoàn tiền Shopee
              </Link>

              <Link
                href="/hoan-tien-lazada"
                className="flex min-h-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-[11px] font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
              >
                Hoàn tiền Lazada
              </Link>

              <Link
                href="/hoan-tien-tiktok-shop"
                className="flex min-h-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-[11px] font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
              >
                Hoàn tiền TikTok Shop
              </Link>

              <Link
                href="/huong-dan-hoan-tien"
                className="flex min-h-[42px] items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
              >
                Hướng dẫn hoàn tiền →
              </Link>
            </div>
          </div>
        </section>

        {/* HOT COUPONS */}
        <HomeCoupons />

        {/* FEATURED PRODUCTS */}
        <FeaturedProducts />
      </main>
    </>
  );
}
