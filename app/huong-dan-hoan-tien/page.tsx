import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";

import HomeAuthNav from "@/components/HomeAuthNav";

import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

const steps = [

  ["01", "Sao chép link sản phẩm", "Mở Shopee, Lazada hoặc TikTok Shop, chọn sản phẩm muốn mua rồi Chia sẻ → Sao chép liên kết."],

  ["02", "Tạo link hoàn tiền", "Quay lại Hoàn Tiền Sale, dán liên kết sản phẩm và nhấn Tạo link hoàn tiền."],

  ["03", "Mua hàng", "Sau khi tạo link thành công, nhấn Mua ngay và hoàn tất đơn hàng trên sàn."],

  ["04", "Theo dõi & nhận tiền", "Theo dõi trạng thái đơn. Khi đơn đủ điều kiện và được xác nhận, tiền hoàn sẽ được cập nhật vào ví."],

];

const guides = [

  ["Shopee", "/hoan-tien-shopee", "Xem hướng dẫn và các lưu ý khi tạo link, mua hàng và theo dõi đơn hoàn tiền Shopee.", "/platforms/shopee.png"],

  ["Lazada", "/hoan-tien-lazada", "Xem hướng dẫn và các lưu ý trong quá trình mua hàng và ghi nhận đơn Lazada.", "/platforms/lazada.png"],

  ["TikTok Shop", "/hoan-tien-tiktok-shop", "Xem cách tạo link sản phẩm TikTok Shop và những điều cần lưu ý trước khi đặt hàng.", "/platforms/tiktok-shop.png"],

];

export default function CashbackGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Trang chủ", url: "/" },
          { name: "Hướng dẫn hoàn tiền", url: "/huong-dan-hoan-tien" },
        ]}
      />

      <main className="min-h-screen bg-[#f7f8fa] text-gray-900">

      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">

          <Link href="/" className="flex shrink-0 items-center sm:hidden" aria-label="Hoàn Tiền Sale">

            <img src="/platforms/hoantiensale.png" alt="Hoàn Tiền Sale" className="h-11 w-11 object-contain" />

          </Link>

          <div className="hidden min-w-0 sm:block"><BrandLogo /></div>

          <div className="ml-auto flex shrink-0 justify-end"><HomeAuthNav /></div>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">

        <div className="flex flex-wrap gap-2">

          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:border-emerald-200 hover:text-emerald-700">← Quay lại</Link>

          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100">⌂ Trang chủ</Link>

        </div>

      </div>

      <section className="px-4 pb-10 pt-10 text-center sm:px-6 sm:pb-14 sm:pt-14">

        <div className="mx-auto max-w-4xl">

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 sm:text-sm">

            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Hướng dẫn dành cho người mới

          </div>

          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-tight text-gray-950 sm:text-4xl md:text-5xl">

            Hướng dẫn nhận hoàn tiền

            <span className="block text-emerald-500">Shopee, Lazada & TikTok Shop</span>

          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">

            Sao chép link sản phẩm, tạo link hoàn tiền tại Hoàn Tiền Sale, đi mua hàng và theo dõi trạng thái đơn ngay trên tài khoản của bạn.

          </p>

          <a href="#quy-trinh" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600">Xem hướng dẫn ngay ↓</a>

        </div>

      </section>

      <section id="quy-trinh" className="scroll-mt-24 px-4 pb-10 sm:px-6">

        <div className="mx-auto max-w-6xl rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">

          <div className="text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Bắt đầu rất đơn giản</p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Quy trình 4 bước</h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">Làm đúng thứ tự dưới đây để hệ thống có thể theo dõi quá trình mua hàng và cập nhật trạng thái đơn.</p>

          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">

            {steps.map(([number, title, desc]) => (

              <div key={number} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 md:text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-lg font-black text-white shadow-lg shadow-emerald-200 md:mx-auto">{number}</div>

                <h3 className="mt-4 font-black text-gray-900">{title}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">{desc}</p>

              </div>

            ))}

          </div>

        </div>

      </section>

      <section className="px-4 pb-10 sm:px-6">

        <div className="mx-auto max-w-4xl rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 font-black text-amber-700">!</div>

            <div>

              <h2 className="font-black text-amber-950">Lưu ý quan trọng</h2>

              <p className="mt-2 text-sm leading-6 text-amber-900">Sau khi mở link mua hàng do Hoàn Tiền Sale tạo, hạn chế chuyển sang một link giới thiệu hoặc quảng cáo khác trước khi đặt hàng vì việc này có thể ảnh hưởng đến quá trình ghi nhận.</p>

              <p className="mt-2 text-sm leading-6 text-amber-900">Trạng thái hoàn tiền phụ thuộc vào việc đơn hàng được hệ thống và đối tác ghi nhận, đáp ứng điều kiện chương trình và được xác nhận sau đó.</p>

            </div>

          </div>

        </div>

      </section>

      <section className="bg-white px-4 py-12 sm:px-6">

        <div className="mx-auto max-w-6xl">

          <div className="text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Xem trực quan</p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Video hướng dẫn chi tiết</h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">Khu vực này đã được chuẩn bị để gắn video hướng dẫn chính thức sau này.</p>

          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-3">

            {["Tạo tài khoản & tạo link", "Hoàn tiền Shopee & Lazada", "Hoàn tiền TikTok Shop"].map((title) => (

              <div key={title} className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">

                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl text-white shadow-lg shadow-emerald-200">▶</div>

                </div>

                <div className="p-5">

                  <div className="flex items-center justify-between gap-3"><h3 className="font-black text-gray-900">{title}</h3><span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500">Sắp có</span></div>

                  <p className="mt-2 text-sm leading-6 text-gray-500">Video hướng dẫn từng bước sẽ được cập nhật tại đây.</p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      <section className="px-4 py-12 sm:px-6">

        <div className="mx-auto max-w-6xl">

          <div className="text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Cần xem kỹ hơn?</p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Hướng dẫn theo từng sàn</h2>

          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">

            {guides.map(([name, href, desc, image]) => (

              <Link key={name} href={href} className="group rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

                <div className="flex items-start justify-between gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">

                    <img src={image} alt={`Logo ${name}`} className="h-full w-full object-contain" />

                  </div>

                  <span className="text-xl text-gray-300 transition group-hover:translate-x-1 group-hover:text-emerald-500">→</span>

                </div>

                <h3 className="mt-4 text-lg font-black">Lưu ý hoàn tiền {name}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">{desc}</p>

                <div className="mt-4 text-sm font-black text-emerald-600">Xem chi tiết hướng dẫn →</div>

              </Link>

            ))}

          </div>

        </div>

      </section>

      <section className="px-4 pb-14 sm:px-6">

        <div className="mx-auto max-w-5xl rounded-[30px] bg-gray-950 px-6 py-9 text-center text-white sm:px-10 sm:py-12">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Sẵn sàng mua sắm?</p>

          <h2 className="mt-3 text-2xl font-black sm:text-3xl">Tạo link hoàn tiền ngay</h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">Quay lại trang chủ, dán link sản phẩm bạn đã định mua và bắt đầu tạo link.</p>

          <Link href="/" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-7 text-sm font-black text-white hover:bg-emerald-600">Bắt đầu tạo link →</Link>

        </div>

      </section>

      </main>
    </>
  );
}
