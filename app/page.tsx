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
                className="h-11 w-11 object-contain"
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
        <section className="relative overflow-hidden bg-white py-8 sm:py-12">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Hoàn tiền khi mua sắm online
              </div>

              <h1 className="mx-auto mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                Link bạn đã định mua,{" "}
                <span className="text-emerald-500">
                  giờ có thể nhận hoàn tiền.
                </span>
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-gray-500 sm:text-sm">
                Dán link sản phẩm từ Shopee, Lazada hoặc TikTok Shop để tạo
                link mua hàng ghi nhận tiền hoàn.
              </p>
            </div>

            {/* MAIN LINK FORM */}
            <div className="mx-auto mt-6 max-w-3xl">
              <LinkForm />

              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-gray-400">
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
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <Link
                href="/hoan-tien-shopee"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:text-sm"
              >
                Hoàn tiền Shopee
              </Link>

              <Link
                href="/hoan-tien-lazada"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:text-sm"
              >
                Hoàn tiền Lazada
              </Link>

              <Link
                href="/hoan-tien-tiktok-shop"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:text-sm"
              >
                Hoàn tiền TikTok Shop
              </Link>

              <Link
                href="/huong-dan-hoan-tien"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 sm:text-sm"
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