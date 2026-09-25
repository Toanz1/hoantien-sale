"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import HomeAuthNav from "@/components/HomeAuthNav";
import LinkForm from "@/components/LinkForm";

const faqs = [
  {
    question: "Mua hàng qua Shopee Video có được hoàn tiền không?",
    answer: (
      <p>
        Đa số là <b className="text-[#10b981]">không ghi nhận.</b> Tỉ lệ không ghi nhận đơn từ Video lên đến 90%.
        Kiểm tra các hướng dẫn chi tiết tại mục Blog.
      </p>
    ),
  },
  {
    question: "Mua hàng qua Shopee Live có được hoàn tiền không?",
    answer: (
      <p>
        Hiện tại, các đơn hàng từ Shopee Live <b className="text-[#10b981]">100% không hoàn tiền.</b>
      </p>
    ),
  },
  {
    question: "Mua hàng qua link Facebook, Instagram, YouTube có được hoàn tiền không?",
    answer: (
      <ul className="list-disc space-y-3 pl-5">
        <li>Nếu gắn Facebook, Instagram, YouTube rồi mua hàng ngay thì <b className="text-[#10b981]">100% không hoàn.</b></li>
        <li>Nếu gắn xong quay lại ấn link hoàn tiền sau ⇒ Vẫn có hoàn tiền nhưng sẽ có tỉ lệ rớt đơn nhất định.</li>
      </ul>
    ),
  },
  {
    question: "Tại sao không được ghi nhận đơn dù đã làm đúng bước?",
    answer: (
      <ul className="list-disc space-y-3 pl-5">
        <li><b>Lịch sử Click:</b> Từng gắn/click/xem giỏ live/video/youtube/facebook/instagram trong vòng 7 ngày gần nhất. Dù xóa tag, hay gắn sản phẩm A mua sản phẩm B vẫn tính là có lịch sử.</li>
        <li><b>Tốc độ đặt hàng:</b> Thời gian đặt hàng kể từ khi mở theo link hoàn tiền quá nhanh. Nên mở link xong sau 2–3 phút rồi mua.</li>
        <li><b>Giỏ hàng:</b> Không thêm trước sản phẩm mua hoàn tiền vào sẵn trong giỏ hàng Shopee. Nếu đã có, nên xóa sản phẩm đó trước khi mở link hoàn tiền.</li>
        <li><b>Lạm dụng:</b> Sử dụng nhiều tài khoản hoặc thiết bị có dấu hiệu bất thường có thể khiến đơn không được ghi nhận hoặc bị hủy.</li>
      </ul>
    ),
  },
  {
    question: "Tại sao đặt đơn bị hủy hàng loạt đơn trong cùng 1 ngày, trong khi đơn hàng đang giao bình thường?",
    answer: (
      <p>
        Các đơn đặt chung một ngày có thể bị hủy khi hệ thống/sàn quét nghi ngờ gian lận, đơn ảo, sử dụng nhiều tài khoản,
        áp mã giảm giá đặc biệt hoặc tài khoản mua hàng có liên quan đến tiếp thị Affiliate.
      </p>
    ),
  },
  {
    question: "Làm thế nào để mua gộp nhiều sản phẩm?",
    answer: (
      <ul className="list-disc space-y-3 pl-5">
        <li>Thêm sản phẩm A B vào giỏ hàng ⇒ dán link sản phẩm C vào web hoàn tiền ⇒ bấm “Mua ngay” ⇒ thêm tiếp C vào giỏ hàng. Sau đó vào giỏ hàng tích chọn A B C và đặt hàng.</li>
        <li>Lưu ý gộp có thể bị giới hạn hoàn tiền hoặc hoàn ít hơn tùy sản phẩm.</li>
      </ul>
    ),
  },
  {
    question: "Tại sao đơn hàng vừa mua chưa hiện lên hệ thống?",
    answer: (
      <p>Đơn hàng đặt thành công, trạng thái của các đơn hàng đó sẽ được cập nhật trước buổi chiều ngày hôm sau (riêng ngày sale có thể lên muộn).</p>
    ),
  },
  {
    question: "Tại sao mua số lượng từ x2 hoặc đơn hàng giá trị cao mà lại chỉ nhận được tiền hoàn là 16.000Đ hoặc số tiền ít hơn tiền dự kiến báo?",
    answer: (
      <ul className="list-disc space-y-3 pl-5">
        <li>Số tiền Web hiển thị dựa theo giá gốc của sản phẩm và báo cho trường hợp mua với số lượng x1. Tiền thực nhận được tính theo số tiền sản phẩm sau khi áp mã và xu.</li>
        <li>Nếu mua số lượng từ x2, bạn có thể liên hệ hỗ trợ để kiểm tra tiền hoàn của đơn hàng cần mua.</li>
      </ul>
    ),
  },
];

export default function ShopeeCashbackPage() {
  const [openItems, setOpenItems] = useState<number[]>(faqs.map((_, i) => i));

  const toggle = (index: number) => {
    setOpenItems((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
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
          <Link href="/" className="rounded-full border border-[#10b981]/40 bg-white px-4 py-2 text-sm font-bold hover:bg-emerald-50">← Quay lại</Link>
          <Link href="/" className="rounded-full border border-[#10b981]/40 bg-white px-4 py-2 text-sm font-bold hover:bg-emerald-50">⌂ Trang chủ</Link>
        </div>

        <div className="mt-6"><LinkForm /></div>

        <section className="py-10 text-center">
          <h1 className="text-3xl font-black">Hoàn tiền Shopee</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-gray-600">
            Hoàn tiền Shopee khi bạn dán link sản phẩm trên Hoàn Tiền Sale rồi bấm Mua ngay.
            Đơn được sàn ghi nhận sau khi đối soát và tiền hoàn sẽ được cộng vào số dư khi đơn đủ điều kiện.
          </p>
        </section>

        <section className="pb-12">
          <h2 className="border-l-4 border-[#10b981] pl-3 text-2xl font-black text-[#10b981]">
            Lưu ý khi hoàn tiền Shopee
          </h2>

          <div className="mt-6 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openItems.includes(index);
              return (
                <div key={faq.question} className="overflow-hidden rounded-2xl border border-[#a7f3d0] bg-white">
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-black sm:text-lg">{index + 1}. {faq.question}</span>
                    <span className="shrink-0 text-2xl font-bold text-[#10b981]">
                      {isOpen ? "⌃" : "⌄"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-emerald-50/20 px-6 py-4 text-sm leading-7 text-[#5b352d] sm:text-base">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-7 border-l-4 border-[#10b981] bg-emerald-50 p-5 text-sm leading-6 text-gray-700">
            <b className="text-[#10b981]">⚠ LƯU Ý QUAN TRỌNG</b><br />
            Việc ghi nhận và phê duyệt đơn phụ thuộc dữ liệu đối soát từ Shopee. Hoàn Tiền Sale chỉ hiển thị dữ liệu nhận được từ sàn và không thể can thiệp vào kết quả đối soát.
          </div>
        </section>
      </div>
    </main>
  );
}
