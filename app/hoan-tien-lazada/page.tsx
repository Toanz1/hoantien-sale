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

    title: "Sao chép link Lazada",

    description:

      "Mở sản phẩm bạn muốn mua trên Lazada và sao chép liên kết của sản phẩm.",

  },

  {

    number: "02",

    title: "Tạo link hoàn tiền",

    description:

      "Dán liên kết Lazada vào Hoàn Tiền Sale và nhấn tạo link hoàn tiền.",

  },

  {

    number: "03",

    title: "Đi đến Lazada",

    description:

      "Sau khi tạo link thành công, sử dụng link hệ thống cung cấp để đi đến Lazada.",

  },

  {

    number: "04",

    title: "Đặt hàng",

    description:

      "Chọn sản phẩm, áp dụng ưu đãi phù hợp và hoàn tất đơn hàng trên Lazada.",

  },

  {

    number: "05",

    title: "Theo dõi đơn",

    description:

      "Theo dõi trạng thái ghi nhận và đối soát đơn hàng trong tài khoản Hoàn Tiền Sale.",

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

      "Tại sao vừa đặt hàng thành công rồi mà vào mục Đơn hàng kiểm tra lại không hiện đơn?",

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

    question:

      "Mua Choice, các đơn hàng được vận chuyển từ nhà bán hàng có được hoàn tiền không?",

    answer: (

      <p>

        Đơn hàng vẫn sẽ được ghi nhận. Tuy nhiên{" "}

        <b className="text-emerald-600">50% đơn hàng Choice</b> (chủ yếu đồ

        bách hóa) và{" "}

        <b className="text-emerald-600">

          100% đơn hàng được vận chuyển từ nhà bán hàng

        </b>{" "}

        sẽ có số tiền được hoàn là 0Đ.

      </p>

    ),

  },

  {

    question:

      "Tại sao số tiền nhận được khi đặt đơn lại ít hơn so với số hoàn tiền tối đa mà web hiển thị?",

    answer: (

      <ul className="list-disc space-y-3 pl-5">

        <li>

          Hoàn tiền sẽ tính theo % nhân(×) tiền sản phẩm. Nên khi áp kèm mã thì

          sẽ là nhân(×) với số tiền sản phẩm{" "}

          <b className="text-emerald-600">SAU KHI ÁP MÃ và XU.</b>

        </li>



        <li>

          Việc bật/tắt hoa hồng thưởng không thể cập nhật thông tin chính xác

          theo thời gian thực được. Thường thông tin chính xác sẽ được cập nhật

          sau 1–2 ngày (Lazada cập nhật). Dẫn đến việc hoa hồng được báo sẽ

          không chính xác 100% vì một số gian hàng thường xuyên thay đổi trạng

          thái bật tắt hoa hồng thưởng.

        </li>

      </ul>

    ),

  },

  {

    question: "Muốn mua gộp nhiều sản phẩm vào cùng 1 đơn hàng phải làm thế nào?",

    answer: (

      <ul className="list-disc space-y-3 pl-5">

        <li>

          <b>Cùng Một Shop:</b> chỉ cần dán một link vào web và bấm mua ngay

          sau đó. Các sản phẩm khác của shop đó đều được áp dụng hoàn tiền.

        </li>



        <li>

          <b>Nhiều Shop Khác Nhau:</b> bắt buộc phải tách đặt riêng mỗi shop

          thành một đơn hàng riêng biệt để đặt hàng.

        </li>

      </ul>

    ),

  },

  {

    question:

      "Tại sao đặt đơn theo các bước hướng dẫn rồi mà không được ghi nhận đơn hoặc bị hủy đơn trong khi đơn hàng vẫn đang giao bình thường?",

    answer: (

      <p>

        Bị Lazada quét do{" "}

        <b className="text-emerald-600">NGHI NGỜ gian lận.</b> Bạn nên liên hệ

        bộ phận hỗ trợ để được kiểm tra thêm.

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
    <>
      <BreadcrumbJsonLd
        items={[
          {
            name: "Trang chủ",
            url: "/",
          },
          {
            name: "Hoàn tiền Lazada",
            url: "/hoan-tien-lazada",
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

            Hoàn tiền Lazada

          </h1>



          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">

            Dán link sản phẩm Lazada vào Hoàn Tiền Sale và đi đến Lazada bằng

            link hệ thống tạo để đơn có thể được ghi nhận hoàn tiền. Bạn có thể

            theo dõi trạng thái đơn và tiền hoàn ngay trong tài khoản.

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

                Cách nhận hoàn tiền Lazada

              </h2>



              <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">

                Sau khi tìm được sản phẩm muốn mua, hãy bắt đầu từ Hoàn Tiền

                Sale trước khi đặt hàng để hệ thống có thể hỗ trợ ghi nhận quá

                trình mua sắm của bạn.

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

            Những điều cần lưu ý khi mua Lazada

          </h2>



          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <div className="text-2xl"></div>



              <h3 className="mt-3 font-black text-gray-900">

                Đi qua link hệ thống

              </h3>



              <p className="mt-2 text-sm leading-6 text-gray-600">

                Sau khi tạo link, hãy sử dụng đường dẫn do Hoàn Tiền Sale cung

                cấp để tiếp tục quá trình mua hàng.

              </p>

            </div>



            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <div className="text-2xl">🛒</div>



              <h3 className="mt-3 font-black text-gray-900">

                Hoàn tất mua hàng

              </h3>



              <p className="mt-2 text-sm leading-6 text-gray-600">

                Hạn chế chuyển sang các đường dẫn giới thiệu khác trong quá

                trình mua để tránh ảnh hưởng đến việc ghi nhận.

              </p>

            </div>



            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <div className="text-2xl">💰</div>



              <h3 className="mt-3 font-black text-gray-900">

                Chờ dữ liệu đối soát

              </h3>



              <p className="mt-2 text-sm leading-6 text-gray-600">

                Trạng thái và số tiền hoàn cuối cùng phụ thuộc vào dữ liệu đối

                soát của Lazada.

              </p>

            </div>

          </div>

        </section>



        {/* FAQ */}

        <section className="pb-12">

          <h2 className="border-l-4 border-emerald-500 pl-3 text-2xl font-black text-emerald-600">

            Lưu ý khi hoàn tiền Lazada

          </h2>



          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">

            Một số câu hỏi thường gặp khi tạo link và theo dõi đơn hoàn tiền

            Lazada tại Hoàn Tiền Sale.

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

            Việc ghi nhận và phê duyệt đơn phụ thuộc dữ liệu đối soát từ

            Lazada. Hoàn Tiền Sale không thể can thiệp vào kết quả đối soát của

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

              TikTok Shop.

            </p>



            <div className="mt-5 flex flex-wrap gap-3">

              <Link

                href="/hoan-tien-shopee"

                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-300 hover:bg-emerald-50"

              >

                Hoàn tiền Shopee →

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