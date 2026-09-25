"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import HomeAuthNav from "@/components/HomeAuthNav";
import LinkForm from "@/components/LinkForm";

const faqs = [
  {
    question: "Mua hàng qua Trưng bày/Video/Live TikTok có được hoàn tiền không?",
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
        <b>Không thêm trước</b> sản phẩm vào trong giỏ hàng. Nếu có hãy <b>xóa khỏi giỏ hàng</b> trước rồi
        bấm link hoàn tiền. Sau khi bấm link hoàn tiền <b>không được bấm</b> qua video/live/trưng bày hoặc
        bấm link mã giảm giá/link quảng cáo khác dẫn đến TikTok.
      </p>
    ),
  },
  {
    question: "Tại sao đơn hàng hoàn tiền bị hủy trong khi đơn trên app TikTok vẫn bình thường?",
    answer: (
      <p>
        Bị đánh <b>nghi ngờ gian lận:</b> Sử dụng nhiều tài khoản trên cùng 1 thiết bị, nhiều thiết bị
        chung 1 thông tin nhận hàng/wifi, mua quá nhiều đơn hàng giống nhau, sử dụng quá nhiều mã giảm
        giá giống nhau.
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
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <BrandLogo />
          <div className="hidden text-xs font-bold text-gray-600 md:block"></div>
          <div className="flex justify-end"><HomeAuthNav /></div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="flex gap-3">
          <Link href="/" className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-bold hover:bg-emerald-50">← Quay lại</Link>
          <Link href="/" className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-bold hover:bg-emerald-50">⌂ Trang chủ</Link>
        </div>

        <div className="mt-6"><LinkForm /></div>

        <section className="py-10 text-center">
          <h1 className="text-3xl font-black">Hoàn tiền TikTok Shop</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-gray-600">
            Dán link sản phẩm TikTok Shop vào Hoàn Tiền Sale và đi đến TikTok Shop bằng link hệ thống tạo để đơn có thể được ghi nhận hoàn tiền.
          </p>
        </section>

        <section className="pb-12">
          <h2 className="border-l-4 border-emerald-500 pl-3 text-2xl font-black text-emerald-600">
            Lưu ý khi hoàn tiền TikTok Shop
          </h2>

          <div className="mt-6 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openItem === index;
              return (
                <div key={faq.question} className="overflow-hidden rounded-2xl border border-emerald-200 bg-white">
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-black sm:text-lg">{index + 1}. {faq.question}</span>
                    <span className="shrink-0 text-2xl font-bold text-emerald-500">
                      {isOpen ? "⌃" : "⌄"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-emerald-50/20 px-6 py-4 text-sm leading-7 text-gray-700 sm:text-base">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-7 border-l-4 border-emerald-500 bg-emerald-50 p-5 text-sm leading-6 text-gray-700">
            <b className="text-emerald-600">⚠ LƯU Ý QUAN TRỌNG</b><br />
            Việc ghi nhận và phê duyệt đơn phụ thuộc dữ liệu đối soát từ TikTok Shop. Hoàn Tiền Sale không thể can thiệp vào kết quả đối soát của sàn.
          </div>
        </section>
      </div>
    </main>
  );
}
