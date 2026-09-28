"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import HomeAuthNav from "@/components/HomeAuthNav";
import LinkForm from "@/components/LinkForm";

const steps = [
  {
    number: "01",
    title: "Sao chép link TikTok Shop",
    description:
      "Mở sản phẩm bạn muốn mua trên TikTok Shop và sao chép liên kết sản phẩm.",
  },
  {
    number: "02",
    title: "Tạo link hoàn tiền",
    description:
      "Dán liên kết TikTok Shop vào Hoàn Tiền Sale và nhấn tạo link hoàn tiền.",
  },
  {
    number: "03",
    title: "Đi đến TikTok Shop",
    description:
      "Sau khi tạo link thành công, sử dụng link hệ thống cung cấp để mở TikTok Shop.",
  },
  {
    number: "04",
    title: "Đặt hàng",
    description:
      "Chọn sản phẩm và hoàn tất quá trình đặt hàng sau khi đi qua link hoàn tiền.",
  },
  {
    number: "05",
    title: "Theo dõi đơn",
    description:
      "Kiểm tra trạng thái ghi nhận và đối soát đơn trong tài khoản Hoàn Tiền Sale.",
  },
  {
    number: "06",
    title: "Nhận tiền hoàn",
    description:
      "Khi đơn đủ điều kiện và được đối soát thành công, tiền hoàn sẽ được cập nhật vào ví.",
  },
];

const faqs = [
  {
    question:
      "Mua hàng qua Trưng bày/Video/Live TikTok có được hoàn tiền không?",
    answer: <p>Không.</p>,
  },
  {
    question: "Mua hàng sau bao lâu thì ghi nhận trên web?",
    answer: <p>Sau 30 phút - 1 tiếng kể từ lúc đặt đơn.</p>,
  },
  {
    question: "Bao lâu kể từ ngày nhận đơn hàng thì tiền sẽ vào số dư ở web?",
    answer: (
      <p>
        Trong vòng <b>15 ngày</b> kể từ ngày bạn nhận được hàng.
      </p>
    ),
  },
  {
    question: "Tại sao không được ghi nhận đơn dù đã làm đúng bước?",
    answer: (
      <p>
        <b>Không thêm trước</b> sản phẩm vào trong giỏ hàng. Nếu có hãy{" "}
        <b>xóa khỏi giỏ hàng</b> trước rồi bấm link hoàn tiền. Sau khi bấm link
        hoàn tiền <b>không được bấm</b> qua video/live/trưng bày hoặc bấm link
        mã giảm giá/link quảng cáo khác dẫn đến TikTok.
      </p>
    ),
  },
  {
    question:
      "Tại sao đơn hàng hoàn tiền bị hủy trong khi đơn trên app TikTok vẫn bình thường?",
    answer: (
      <p>
        Bị đánh <b>nghi ngờ gian lận:</b> Sử dụng nhiều tài khoản trên cùng 1
        thiết bị, nhiều thiết bị chung 1 thông tin nhận hàng/wifi, mua quá nhiều
        đơn hàng giống nhau, sử dụng quá nhiều mã giảm giá giống nhau.
      </p>
    ),
  },
];

export default function TikTokShopCashbackPage() {
  const [openItem, setOpenItem] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenItem((current) => (current === index ? null : index));
  };

  return (
    <main className="min-h-screen bg-[#fffdfb] text-gray-900">
      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <BrandLogo />

          <div className="hidden text-xs font-bold text-gray-600 md:block" />

          <div className="flex justify-end">
            <HomeAuthNav />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        {/* NAVIGATION */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-bold transition hover:bg-emerald-50"
          >
            ← Quay lại
          </Link>

          <Link
            href="/"
            className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-bold transition hover:bg-emerald-50"
          >
            ⌂ Trang chủ
          </Link>
        </div>

        {/* LINK FORM */}
        <div className="mt-6">
          <LinkForm />
        </div>

        {/* HERO */}
        <section className="py-10 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">
            Hoàn tiền TikTok Shop
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">
            Dán link sản phẩm TikTok Shop vào Hoàn Tiền Sale và đi đến TikTok
            Shop bằng link hệ thống tạo để đơn có thể được ghi nhận hoàn tiền.
            Bạn có thể theo dõi trạng thái đơn và tiền hoàn ngay trong tài khoản.
          </p>
        </section>

        {/* HOW TO */}
        <section className="pb-12">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8">
            <div className="max-w-3xl">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
                Hướng dẫn từng bước
              </span>

              <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">
                Cách nhận hoàn tiền TikTok Shop
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
                Khi đã tìm được sản phẩm muốn mua trên TikTok Shop, hãy bắt đầu
                từ Hoàn Tiền Sale trước khi đặt hàng để hệ thống có thể hỗ trợ
                ghi nhận quá trình mua sắm.
              </p>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white">
                    {step.number}
                  </div>

                  <h3 className="mt-4 text-base font-black text-gray-900">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/huong-dan-hoan-tien"
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                Xem hướng dẫn đầy đủ →
              </Link>

              <Link
                href="/orders"
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Theo dõi đơn hàng
              </Link>
            </div>
          </div>
        </section>

        {/* IMPORTANT CONDITIONS */}
        <section className="pb-12">
          <h2 className="border-l-4 border-emerald-500 pl-3 text-2xl font-black text-gray-900">
            Những điều cần lưu ý khi mua TikTok Shop
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-2xl">🛒</div>

              <h3 className="mt-3 font-black text-gray-900">
                Kiểm tra giỏ hàng
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Theo hướng dẫn hiện tại, nếu sản phẩm đã được thêm vào giỏ trước
                đó thì hãy xóa sản phẩm khỏi giỏ trước khi tạo và sử dụng link
                hoàn tiền.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-2xl">🔗</div>

              <h3 className="mt-3 font-black text-gray-900">
                Không đổi sang link khác
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Sau khi đi qua link hoàn tiền, tránh mở lại sản phẩm thông qua
                video, livestream, trưng bày hoặc các link quảng cáo khác.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-2xl">💰</div>

              <h3 className="mt-3 font-black text-gray-900">
                Chờ dữ liệu đối soát
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Việc ghi nhận, phê duyệt và số tiền hoàn cuối cùng phụ thuộc
                vào dữ liệu đối soát của TikTok Shop.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-12">
          <h2 className="border-l-4 border-emerald-500 pl-3 text-2xl font-black text-emerald-600">
            Lưu ý khi hoàn tiền TikTok Shop
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Một số câu hỏi thường gặp khi tạo link và theo dõi đơn hoàn tiền
            TikTok Shop tại Hoàn Tiền Sale.
          </p>

          <div className="mt-6 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openItem === index;

              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-2xl border border-emerald-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    <span className="text-base font-black sm:text-lg">
                      {index + 1}. {faq.question}
                    </span>

                    <span className="shrink-0 text-2xl font-bold text-emerald-500">
                      {isOpen ? "⌃" : "⌄"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-emerald-50/20 px-5 py-4 text-sm leading-7 text-gray-700 sm:px-6 sm:text-base">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-7 border-l-4 border-emerald-500 bg-emerald-50 p-5 text-sm leading-7 text-gray-700">
            <b className="text-emerald-600">⚠ LƯU Ý QUAN TRỌNG</b>
            <br />
            Việc ghi nhận và phê duyệt đơn phụ thuộc dữ liệu đối soát từ TikTok
            Shop. Hoàn Tiền Sale không thể can thiệp vào kết quả đối soát của
            sàn.
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section className="pb-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black text-gray-900">
              Hướng dẫn các nền tảng khác
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Bạn cũng có thể xem hướng dẫn mua sắm hoàn tiền trên Shopee và
              Lazada.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/hoan-tien-shopee"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                Hoàn tiền Shopee →
              </Link>

              <Link
                href="/hoan-tien-lazada"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                Hoàn tiền Lazada →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}