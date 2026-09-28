

import LinkForm from "@/components/LinkForm";
import HomeAuthNav from "@/components/HomeAuthNav";
import FeaturedProducts from "@/components/FeaturedProducts";
import BrandLogo from "@/components/BrandLogo";
import HomeCoupons from "@/components/HomeCoupons";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Sao chép link",
    description: "Chọn sản phẩm trên sàn và sao chép link.",
  },
  {
    number: "02",
    title: "Tạo link hoàn tiền",
    description: "Dán link vào hệ thống để tạo tracking riêng.",
  },
  {
    number: "03",
    title: "Mua hàng",
    description: "Đi đến sàn bằng nút Mua ngay.",
  },
  {
    number: "04",
    title: "Nhận tiền hoàn",
    description: "Đơn duyệt, tiền sẽ về ví của bạn.",
  },
];

export default function Home() {
  return (
    <main id="top" className="min-h-screen bg-[#f7f8fa] text-gray-900">
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

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white py-8 sm:py-12">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Hoàn tiền khi mua sắm online
            </div>

            <h1 className="mx-auto mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Link bạn đã định mua,{" "}
              <span className="text-emerald-500">giờ có thể nhận hoàn tiền.</span>
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-xs text-gray-500 sm:text-sm">
              Dán link sản phẩm từ Shopee, Lazada hoặc TikTok Shop để tạo link mua hàng ghi nhận tiền hoàn.
            </p>
          </div>

          {/* MAIN SEARCH */}
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
            {/* HOT COUPONS */}
      <HomeCoupons />

      {/* FEATURED PRODUCTS */}
      <FeaturedProducts />

      
    </main>
  );
}