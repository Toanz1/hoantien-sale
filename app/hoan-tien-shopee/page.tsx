"use client";



import { useState } from "react";

import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";

import HomeAuthNav from "@/components/HomeAuthNav";

import LinkForm from "@/components/LinkForm";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";



const steps = [

  {

    number: "01",

    title: "Sao chép link Shopee",

    description:

      "Mở sản phẩm bạn muốn mua trên Shopee và sao chép liên kết sản phẩm.",

  },

  {

    number: "02",

    title: "Tạo link hoàn tiền",

    description:

      "Dán liên kết Shopee vào Hoàn Tiền Sale và nhấn tạo link hoàn tiền.",

  },

  {

    number: "03",

    title: "Đi đến Shopee",

    description:

      "Sau khi tạo link thành công, sử dụng link hệ thống cung cấp để mở Shopee.",

  },

  {

    number: "04",

    title: "Đặt hàng",

    description:

      "Chọn sản phẩm, áp dụng ưu đãi phù hợp và hoàn tất đơn hàng trên Shopee.",

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

    question: "Mua hàng qua Shopee Video có được hoàn tiền không?",

    answer: (

      <p>

        Đa số là <b className="text-emerald-600">không ghi nhận.</b> Tỉ lệ

        không ghi nhận đơn từ Video lên đến 90%. Kiểm tra các hướng dẫn chi

        tiết tại mục Blog.

      </p>

    ),

  },

  {

    question: "Mua hàng qua Shopee Live có được hoàn tiền không?",

    answer: (

      <p>

        Hiện tại, các đơn hàng từ Shopee Live{" "}

        <b className="text-emerald-600">100% không hoàn tiền.</b>

      </p>

    ),

  },

  {

    question:

      "Mua hàng qua link Facebook, Instagram, YouTube có được hoàn tiền không?",

    answer: (

      <ul className="list-disc space-y-3 pl-5">

        <li>

          Nếu gắn Facebook, Instagram, YouTube rồi mua hàng ngay thì{" "}

          <b className="text-emerald-600">100% không hoàn.</b>

        </li>



        <li>

          Nếu gắn xong quay lại ấn link hoàn tiền sau ⇒ Vẫn có hoàn tiền nhưng

          sẽ có tỉ lệ rớt đơn nhất định.

        </li>

      </ul>

    ),

  },

  {

    question: "Tại sao không được ghi nhận đơn dù đã làm đúng bước?",

    answer: (

      <ul className="list-disc space-y-3 pl-5">

        <li>

          <b>Lịch sử Click:</b> Từng gắn/click/xem giỏ

          live/video/youtube/facebook/instagram trong vòng 7 ngày gần nhất. Dù

          xóa tag, hay gắn sản phẩm A mua sản phẩm B vẫn tính là có lịch sử.

        </li>



        <li>

          <b>Tốc độ đặt hàng:</b> Thời gian đặt hàng kể từ khi mở theo link

          hoàn tiền quá nhanh. Nên mở link xong sau 2–3 phút rồi mua.

        </li>



        <li>

          <b>Giỏ hàng:</b> Không thêm trước sản phẩm mua hoàn tiền vào sẵn trong

          giỏ hàng Shopee. Nếu đã có, nên xóa sản phẩm đó trước khi mở link hoàn

          tiền.

        </li>



        <li>

          <b>Lạm dụng:</b> Sử dụng nhiều tài khoản hoặc thiết bị có dấu hiệu bất

          thường có thể khiến đơn không được ghi nhận hoặc bị hủy.

        </li>

      </ul>

    ),

  },

  {

    question:

      "Tại sao đặt đơn bị hủy hàng loạt đơn trong cùng 1 ngày, trong khi đơn hàng đang giao bình thường?",

    answer: (

      <p>

        Các đơn đặt chung một ngày có thể bị hủy khi hệ thống/sàn quét nghi ngờ

        gian lận, đơn ảo, sử dụng nhiều tài khoản, áp mã giảm giá đặc biệt hoặc

        tài khoản mua hàng có liên quan đến tiếp thị Affiliate.

      </p>

    ),

  },

  {

    question: "Làm thế nào để mua gộp nhiều sản phẩm?",

    answer: (

      <ul className="list-disc space-y-3 pl-5">

        <li>

          Thêm sản phẩm A B vào giỏ hàng ⇒ dán link sản phẩm C vào web hoàn tiền

          ⇒ bấm “Mua ngay” ⇒ thêm tiếp C vào giỏ hàng. Sau đó vào giỏ hàng tích

          chọn A B C và đặt hàng.

        </li>



        <li>

          Lưu ý gộp có thể bị giới hạn hoàn tiền hoặc hoàn ít hơn tùy sản phẩm.

        </li>

      </ul>

    ),

  },

  {

    question: "Tại sao đơn hàng vừa mua chưa hiện lên hệ thống?",

    answer: (

      <p>

        Đơn hàng đặt thành công, trạng thái của các đơn hàng đó sẽ được cập nhật

        trước buổi chiều ngày hôm sau (riêng ngày sale có thể lên muộn).

      </p>

    ),

  },

  {

    question:

      "Tại sao mua số lượng từ x2 hoặc đơn hàng giá trị cao mà lại chỉ nhận được tiền hoàn là 16.000Đ hoặc số tiền ít hơn tiền dự kiến báo?",

    answer: (

      <ul className="list-disc space-y-3 pl-5">

        <li>

          Số tiền Web hiển thị dựa theo giá gốc của sản phẩm và báo cho trường

          hợp mua với số lượng x1. Tiền thực nhận được tính theo số tiền sản

          phẩm sau khi áp mã và xu.

        </li>



        <li>

          Nếu mua số lượng từ x2, bạn có thể liên hệ hỗ trợ để kiểm tra tiền

          hoàn của đơn hàng cần mua.

        </li>

      </ul>

    ),

  },

];



export default function ShopeeCashbackPage() {

  const [openItems, setOpenItems] = useState<number[]>([0]);



  const toggle = (index: number) => {

    setOpenItems((current) =>

      current.includes(index)

        ? current.filter((item) => item !== index)

        : [...current, index]

    );

  };



  return (
    <>
      <BreadcrumbJsonLd
        items={[
          {
            name: "Trang chủ",
            url: "/",
          },
          {
            name: "Hoàn tiền Shopee",
            url: "/hoan-tien-shopee",
          },
        ]}
      />

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

            Hoàn tiền Shopee

          </h1>



          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">

            Tạo link mua sắm hoàn tiền Shopee tại Hoàn Tiền Sale, đi đến Shopee

            bằng link hệ thống tạo và theo dõi trạng thái đơn sau khi có dữ liệu

            đối soát.

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

                Cách nhận hoàn tiền Shopee

              </h2>



              <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">

                Khi đã chọn được sản phẩm muốn mua trên Shopee, hãy sao chép

                liên kết sản phẩm và tạo link tại Hoàn Tiền Sale trước khi hoàn

                tất quá trình đặt hàng.

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



            <div className="mt-7 flex flex-wrap gap-3">

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

            Những điều cần lưu ý khi mua Shopee

          </h2>



          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <div className="text-2xl">🛒</div>



              <h3 className="mt-3 font-black text-gray-900">

                Kiểm tra giỏ hàng

              </h3>



              <p className="mt-2 text-sm leading-6 text-gray-600">

                Theo hướng dẫn hiện tại, nếu sản phẩm cần mua đã nằm sẵn trong

                giỏ hàng thì nên xóa sản phẩm trước khi mở link hoàn tiền.

              </p>

            </div>



            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <div className="text-2xl">🔗</div>



              <h3 className="mt-3 font-black text-gray-900">

                Hạn chế đổi nguồn truy cập

              </h3>



              <p className="mt-2 text-sm leading-6 text-gray-600">

                Sau khi mở link hoàn tiền, hạn chế chuyển qua các link giới

                thiệu, video, livestream hoặc nguồn quảng cáo khác trước khi đặt

                hàng.

              </p>

            </div>



            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <div className="text-2xl">💰</div>



              <h3 className="mt-3 font-black text-gray-900">

                Chờ dữ liệu đối soát

              </h3>



              <p className="mt-2 text-sm leading-6 text-gray-600">

                Việc ghi nhận, phê duyệt và số tiền hoàn cuối cùng phụ thuộc vào

                dữ liệu đối soát từ Shopee.

              </p>

            </div>

          </div>

        </section>



        {/* FAQ */}

        <section className="pb-12">

          <h2 className="border-l-4 border-emerald-500 pl-3 text-2xl font-black text-emerald-600">

            Lưu ý khi hoàn tiền Shopee

          </h2>



          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">

            Một số câu hỏi thường gặp khi tạo link, mua hàng và theo dõi đơn

            hoàn tiền Shopee tại Hoàn Tiền Sale.

          </p>



          <div className="mt-6 space-y-4">

            {faqs.map((faq, index) => {

              const isOpen = openItems.includes(index);



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

            Việc ghi nhận và phê duyệt đơn phụ thuộc dữ liệu đối soát từ

            Shopee. Hoàn Tiền Sale chỉ hiển thị dữ liệu nhận được từ sàn và

            không thể can thiệp vào kết quả đối soát.

          </div>

        </section>



        {/* INTERNAL LINKS */}

        <section className="pb-8">

          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">

            <h2 className="text-xl font-black text-gray-900">

              Hướng dẫn các nền tảng khác

            </h2>



            <p className="mt-2 text-sm leading-6 text-gray-600">

              Bạn cũng có thể xem hướng dẫn mua sắm hoàn tiền trên Lazada và

              TikTok Shop.

            </p>



            <div className="mt-5 flex flex-wrap gap-3">

              <Link

                href="/hoan-tien-lazada"

                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-300 hover:bg-emerald-50"

              >

                Hoàn tiền Lazada →

              </Link>



              <Link

                href="/hoan-tien-tiktok-shop"

                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-300 hover:bg-emerald-50"

              >

                Hoàn tiền TikTok Shop →

              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
    </>
  );
}