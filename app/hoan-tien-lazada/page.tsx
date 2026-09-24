"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import HomeAuthNav from "@/components/HomeAuthNav";
import LinkForm from "@/components/LinkForm";

const faqs = [
  {
    question: "Tại sao vừa đặt hàng thành công rồi mà vào mục Đơn hàng kiểm tra lại không hiện đơn?",
    answer: (
      <p>
        Đơn hàng đặt thành công sẽ được cập nhật vào trước{" "}
        <b className="text-emerald-600">20H của ngày hôm sau.</b>
      </p>
    ),
  },
  {
    question: "Mua đơn từ LazLive, Like có được hoàn tiền không?",
    answer: (
      <p>
        Nếu bạn mua trực tiếp từ giỏ Livestream, giỏ video của mục Like thì sẽ{" "}
        <b className="text-emerald-600">KHÔNG được hoàn tiền.</b>
      </p>
    ),
  },
  {
    question: "Mua Choice, các đơn hàng được vận chuyển từ nhà bán hàng có được hoàn tiền không?",
    answer: (
      <p>
        Đơn hàng vẫn sẽ được ghi nhận. Tuy nhiên{" "}
        <b className="text-emerald-600">50% đơn hàng Choice</b> (chủ yếu đồ bách hóa) và{" "}
        <b className="text-emerald-600">100% đơn hàng được vận chuyển từ nhà bán hàng</b>{" "}
        sẽ có số tiền được hoàn là 0Đ.
      </p>
    ),
  },
  {
    question: "Tại sao số tiền nhận được khi đặt đơn lại ít hơn so với số hoàn tiền tối đa mà web hiển thị?",
    answer: (
      <ul className="list-disc space-y-3 pl-5">
        <li>
          Hoàn tiền sẽ tính theo % nhân(×) tiền sản phẩm. Nên khi áp kèm mã thì sẽ là nhân(×)
          với số tiền sản phẩm <b className="text-emerald-600">SAU KHI ÁP MÃ và XU.</b>
        </li>
        <li>
          Việc bật/tắt hoa hồng thưởng không thể cập nhật thông tin chính xác theo thời gian thực được.
          Thường thông tin chính xác sẽ được cập nhật sau 1–2 ngày (Lazada cập nhật). Dẫn đến việc hoa
          hồng được báo sẽ không chính xác 100% vì một số gian hàng thường xuyên thay đổi trạng thái
          bật tắt hoa hồng thưởng.
        </li>
      </ul>
    ),
  },
  {
    question: "Muốn mua gộp nhiều sản phẩm vào cùng 1 đơn hàng phải làm thế nào?",
    answer: (
      <ul className="list-disc space-y-3 pl-5">
        <li>
          <b>Cùng Một Shop:</b> chỉ cần dán một link vào web và bấm mua ngay sau đó. Các sản phẩm khác
          của shop đó đều được áp dụng hoàn tiền.
        </li>
        <li>
          <b>Nhiều Shop Khác Nhau:</b> bắt buộc phải tách đặt riêng mỗi shop thành một đơn hàng riêng
          biệt để đặt hàng.
        </li>
      </ul>
    ),
  },
  {
    question: "Tại sao đặt đơn theo các bước hướng dẫn rồi mà không được ghi nhận đơn hoặc bị hủy đơn trong khi đơn hàng vẫn đang giao bình thường?",
    answer: (
      <p>
        Bị Lazada quét do <b className="text-emerald-600">NGHI NGỜ gian lận.</b> Bạn nên liên hệ bộ phận
        hỗ trợ để được kiểm tra thêm.
      </p>
    ),
  },
];

export default function LazadaCashbackPage() {
  const [openItem, setOpenItem] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenItem((current) => (current === index ? null : index));
  };

  return (
    <main className="min-h-screen bg-[#fffdfb] text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <BrandLogo />
          <div className="hidden text-xs font-bold text-gray-600 md:block">Mua sắm hoàn tiền</div>
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
          <h1 className="text-3xl font-black">Hoàn tiền Lazada</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-gray-600">
            Dán link sản phẩm Lazada vào Hoàn Tiền Sale và đi đến Lazada bằng link hệ thống tạo để đơn có thể được ghi nhận hoàn tiền.
          </p>
        </section>

        <section className="pb-12">
          <h2 className="border-l-4 border-emerald-500 pl-3 text-2xl font-black text-emerald-600">
            Lưu ý khi hoàn tiền Lazada
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
            Việc ghi nhận và phê duyệt đơn phụ thuộc dữ liệu đối soát từ Lazada. Hoàn Tiền Sale không thể can thiệp vào kết quả đối soát của sàn.
          </div>
        </section>
      </div>
    </main>
  );
}
