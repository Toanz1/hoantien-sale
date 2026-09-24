"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LinkForm from "@/components/LinkForm";
import MobileNav from "@/components/MobileNav";
import { createClient } from "@/lib/supabase/client";

type AffiliateLink = {
  id: string;
  user_id: string;
  platform: string;
  tracking_id: string;
  original_url: string | null;
  affiliate_url: string | null;
  featured_product_id: string | null;
  created_at?: string | null;
};

type FeaturedProduct = {
  id: string;
  name: string;
  platform: string;
  product_url: string;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  cashback_percent: number | null;
};

type TrackingResponse = {
  success?: boolean;
  error?: string;
  link?: AffiliateLink;
  product?: FeaturedProduct | null;
};

/* =========================================================
   PLATFORM
========================================================= */

function getPlatformName(platform: string) {
  switch (platform?.toLowerCase()) {
    case "shopee":
      return "Shopee";

    case "lazada":
      return "Lazada";

    case "tiktok":
    case "tiktokshop":
    case "tiktok_shop":
      return "TikTok Shop";

    default:
      return platform || "Sàn thương mại điện tử";
  }
}

function getPlatformStyle(platform: string) {
  switch (platform?.toLowerCase()) {
    case "shopee":
      return {
        icon: "S",
        badge:
          "border-orange-200 bg-orange-50 text-orange-600",
        imageBg:
          "from-orange-50 via-white to-orange-50",
      };

    case "lazada":
      return {
        icon: "L",
        badge:
          "border-blue-200 bg-blue-50 text-blue-600",
        imageBg:
          "from-blue-50 via-white to-purple-50",
      };

    default:
      return {
        icon: "♪",
        badge:
          "border-gray-200 bg-gray-950 text-white",
        imageBg:
          "from-gray-100 via-white to-gray-50",
      };
  }
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function calculateCashback(
  price: number | null,
  percent: number | null
) {
  if (
    price === null ||
    percent === null ||
    !Number.isFinite(Number(price)) ||
    !Number.isFinite(Number(percent)) ||
    price <= 0 ||
    percent <= 0
  ) {
    return null;
  }

  return Math.floor(
    (Number(price) * Number(percent)) / 100
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductResultPage() {
  const params = useParams();
  const router = useRouter();

  const rawTrackingId =
  params?.trackingId;

const trackingId: string =
  typeof rawTrackingId === "string"
    ? rawTrackingId
    : Array.isArray(rawTrackingId) &&
        typeof rawTrackingId[0] === "string"
      ? rawTrackingId[0]
      : "";

  const [link, setLink] =
    useState<AffiliateLink | null>(null);

  const [product, setProduct] =
    useState<FeaturedProduct | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [imageFailed, setImageFailed] =
    useState(false);

  /* =======================================================
     LOAD TRACKING + PRODUCT
  ======================================================= */

  useEffect(() => {
    if (!trackingId) {
      setError(
        "Tracking ID không hợp lệ."
      );

      setLoading(false);

      return;
    }

    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");
      setImageFailed(false);

      try {
        const supabase =
          createClient();

        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (
          sessionError ||
          !session
        ) {
          router.replace(
            `/login?next=${encodeURIComponent(
              `/san-pham/${trackingId}`
            )}`
          );

          return;
        }

        const response =
          await fetch(
            `/api/links/${encodeURIComponent(
              trackingId
            )}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },

              cache: "no-store",
            }
          );

        let data:
          | TrackingResponse
          | null = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!active) {
          return;
        }

        if (
          response.status === 401
        ) {
          router.replace(
            `/login?next=${encodeURIComponent(
              `/san-pham/${trackingId}`
            )}`
          );

          return;
        }

        if (!response.ok) {
          setLink(null);
          setProduct(null);

          setError(
            data?.error ||
              "Không thể tải thông tin link hoàn tiền."
          );

          return;
        }

        if (!data?.link) {
          setLink(null);
          setProduct(null);

          setError(
            "Không tìm thấy link hoàn tiền này."
          );

          return;
        }

        setLink(data.link);

        setProduct(
          data.product ?? null
        );
      } catch (err) {
        console.error(
          "Load product result error:",
          err
        );

        if (active) {
          setLink(null);
          setProduct(null);

          setError(
            "Có lỗi kết nối đến hệ thống."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [trackingId, router]);

  /* =======================================================
     SHARE
  ======================================================= */

  async function shareLink() {
    if (!link) {
      return;
    }

    try {
      const shareUrl =
        window.location.href;

      const shareData = {
        title:
          product?.name ||
          "Link hoàn tiền Hoàn Tiền Sale",

        text: product
          ? `${product.name} - mua hàng qua Hoàn Tiền Sale`
          : "Mua hàng qua link hoàn tiền của Hoàn Tiền Sale.",

        url: shareUrl,
      };

      if (
        navigator.share &&
        typeof navigator.share ===
          "function"
      ) {
        try {
          await navigator.share(
            shareData
          );

          return;
        } catch (shareError) {
          if (
            shareError instanceof
              DOMException &&
            shareError.name ===
              "AbortError"
          ) {
            return;
          }
        }
      }

      if (
        navigator.clipboard &&
        typeof navigator.clipboard
          .writeText === "function"
      ) {
        await navigator.clipboard.writeText(
          shareUrl
        );
      } else {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          shareUrl;

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.focus();
        textarea.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          textarea
        );
      }

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "Share product link error:",
        err
      );

      setError(
        "Không thể chia sẻ link. Bạn vui lòng thử lại."
      );
    }
  }

  /* =======================================================
     BUY
  ======================================================= */

  function buyNow() {
    if (!link?.affiliate_url) {
      setError(
        "Link mua hàng hiện chưa sẵn sàng."
      );

      return;
    }

    /*
     * Quan trọng:
     * Luôn mở affiliate_url.
     * Không mở product.product_url.
     */
    window.location.href =
      link.affiliate_url;
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const platformStyle =
    link
      ? getPlatformStyle(
          link.platform
        )
      : null;

  const cashbackAmount =
    product
      ? calculateCashback(
          product.price,
          product.cashback_percent
        )
      : null;

  const hasProductInfo =
    Boolean(product);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-24 text-gray-900 md:pb-0">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 font-black text-white shadow-sm shadow-emerald-200">
              H
            </div>

            <div>
              <div className="text-sm font-black sm:text-base">
                Hoàn Tiền Sale
              </div>

              <div className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 sm:block">
                Mua sắm · Nhận tiền
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:text-sm"
          >
            ← Trang chủ
          </Link>
        </div>
      </header>

      {/* =================================================
          SEARCH AGAIN
      ================================================= */}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-2 text-xs font-bold text-gray-500">
              Muốn tìm sản phẩm khác?
            </div>

            <LinkForm compact />
          </div>
        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 md:py-9">
        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-950"
        >
          <span>←</span>
          Quay lại
        </button>

        {/* ===============================================
            LOADING
        =============================================== */}

        {loading && (
          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="aspect-square animate-pulse rounded-[28px] bg-gray-200" />

            <div className="rounded-[28px] border border-gray-200 bg-white p-6 sm:p-8">
              <div className="h-6 w-28 animate-pulse rounded-lg bg-gray-200" />

              <div className="mt-6 h-9 w-3/4 animate-pulse rounded-lg bg-gray-200" />

              <div className="mt-3 h-5 w-full animate-pulse rounded-lg bg-gray-100" />

              <div className="mt-8 h-28 animate-pulse rounded-2xl bg-gray-100" />

              <div className="mt-4 h-14 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </div>
        )}

        {/* ===============================================
            ERROR
        =============================================== */}

        {!loading &&
          error &&
          !link && (
            <div className="mx-auto max-w-2xl rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-500">
                !
              </div>

              <h1 className="mt-5 text-2xl font-black">
                Không thể mở link
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                {error}
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                Về trang chủ
              </Link>
            </div>
          )}

        {/* ===============================================
            PRODUCT
        =============================================== */}

        {!loading && link && (
          <>
            <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              {/* =========================================
                  PRODUCT IMAGE
              ========================================= */}

              <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                <div
                  className={`relative flex aspect-square items-center justify-center bg-gradient-to-br ${
                    platformStyle?.imageBg ||
                    "from-gray-50 via-white to-gray-50"
                  }`}
                >
                  <div className="absolute left-4 top-4 z-10">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black shadow-sm ${
                        platformStyle?.badge ||
                        "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {getPlatformName(
                        link.platform
                      )}
                    </span>
                  </div>

                  {product?.image_url &&
                  !imageFailed ? (
                    <img
                      src={
                        product.image_url
                      }
                      alt={product.name}
                      onError={() =>
                        setImageFailed(
                          true
                        )
                      }
                      className="h-full w-full object-contain p-5 sm:p-8"
                    />
                  ) : (
                    <div className="p-8 text-center">
                      {platformStyle && (
                        <div
                          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border text-4xl font-black shadow-sm ${platformStyle.badge}`}
                        >
                          {
                            platformStyle.icon
                          }
                        </div>
                      )}

                      <div className="mt-5 text-xl font-black">
                        {getPlatformName(
                          link.platform
                        )}
                      </div>

                      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                        {product
                          ? "Không thể tải ảnh sản phẩm."
                          : "Link mua hàng đã được tạo riêng cho tài khoản của bạn."}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* =========================================
                  PRODUCT INFORMATION
              ========================================= */}

              <section className="flex flex-col">
                <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  {/* BADGES */}

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                      ✓ Link hoàn tiền đã sẵn sàng
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                        platformStyle?.badge ||
                        "border-gray-200 bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getPlatformName(
                        link.platform
                      )}
                    </span>
                  </div>

                  {/* =====================================
                      FEATURED PRODUCT
                  ===================================== */}

                  {hasProductInfo &&
                  product ? (
                    <>
                      <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                        {product.name}
                      </h1>

                      {/* PRICE */}

                      <div className="mt-6">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Giá sản phẩm
                        </div>

                        <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                          {product.price !==
                          null ? (
                            <span className="text-3xl font-black text-gray-950">
                              {formatMoney(
                                product.price
                              )}
                              <span className="ml-1 text-base">
                                ₫
                              </span>
                            </span>
                          ) : (
                            <span className="font-bold text-gray-500">
                              Xem giá trên
                              sàn
                            </span>
                          )}

                          {product.original_price !==
                            null &&
                            product.price !==
                              null &&
                            product.original_price >
                              product.price && (
                              <span className="pb-1 text-sm font-medium text-gray-400 line-through">
                                {formatMoney(
                                  product.original_price
                                )}{" "}
                                ₫
                              </span>
                            )}
                        </div>
                      </div>

                      {/* CASHBACK */}

                      {cashbackAmount !==
                        null && (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-xs font-black uppercase tracking-wider text-emerald-700">
                                  Hoàn tiền
                                  dự kiến
                                </div>

                                <div className="mt-1 text-3xl font-black text-emerald-600">
                                  {formatMoney(
                                    cashbackAmount
                                  )}{" "}
                                  ₫
                                </div>
                              </div>

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                                💰
                              </div>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-emerald-800/70">
                              Tiền hoàn thực
                              tế được ghi nhận
                              sau khi đơn hàng
                              được hệ thống
                              đối soát.
                            </p>
                          </div>

                          <div className="border-t border-emerald-200 bg-white/50 px-5 py-3 text-xs font-semibold text-emerald-800">
                            Tỷ lệ hoàn đang áp
                            dụng:{" "}
                            {product.cashback_percent}
                            %
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ===================================
                       USER PASTED URL
                    =================================== */

                    <>
                      <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                        Tiếp tục mua hàng
                        để được ghi nhận
                        hoàn tiền
                      </h1>

                      <p className="mt-3 text-sm leading-7 text-gray-500">
                        Link mua hàng của
                        bạn đã được tạo
                        thành công. Bấm{" "}
                        <strong className="text-gray-700">
                          Mua ngay
                        </strong>{" "}
                        để tiếp tục sang{" "}
                        {getPlatformName(
                          link.platform
                        )}
                        .
                      </p>
                    </>
                  )}

                  {/* NON-FATAL ERROR */}

                  {error && (
                    <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                {/* =====================================
                    ACTIONS
                ===================================== */}

                {link.affiliate_url ? (
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={buyNow}
                      className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0"
                    >
                      <span>🛒</span>
                      Mua ngay
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={shareLink}
                      className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-400 px-6 text-sm font-black text-gray-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0"
                    >
                      {copied ? (
                        <>
                          <span>✓</span>
                          Đã sao chép
                          link chia sẻ
                        </>
                      ) : (
                        <>
                          <span>↗</span>
                          Chia sẻ link
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                    Link mua hàng hiện
                    chưa sẵn sàng. Bạn
                    vui lòng quay lại và
                    thử tạo link khác.
                  </div>
                )}

                {/* =====================================
                    NOTICE
                ===================================== */}

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-white text-sm font-black text-amber-600">
                      i
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-700">
                        Một số lưu ý
                        trước khi mua
                        hàng
                      </div>

                      <div className="mt-1 text-xs leading-5 text-gray-500">
                        Hãy bắt đầu mua
                        hàng bằng nút{" "}
                        <strong>
                          Mua ngay
                        </strong>{" "}
                        để hệ thống ghi
                        nhận đúng
                        tracking.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ===========================================
                HOW IT WORKS
            =========================================== */}

            <section className="mt-6 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black">
                  Mua đúng cách để được
                  hoàn tiền
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Thực hiện theo 3 bước
                  đơn giản dưới đây.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Instruction
                  number="1"
                  title="Bấm Mua ngay"
                >
                  Đi đến sản phẩm bằng
                  link đã tạo trên Hoàn
                  Tiền Sale.
                </Instruction>

                <Instruction
                  number="2"
                  title="Hoàn tất đơn hàng"
                >
                  Chọn sản phẩm và thanh
                  toán trực tiếp trên sàn
                  như bình thường.
                </Instruction>

                <Instruction
                  number="3"
                  title="Theo dõi tiền hoàn"
                >
                  Khi đơn được ghi nhận
                  và đối soát, kiểm tra
                  kết quả trong mục Đơn
                  hàng.
                </Instruction>
              </div>
            </section>

            {/* ===========================================
                TRACKING
            =========================================== */}

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Tracking ID
                </div>

                <div className="mt-1 truncate font-mono text-xs font-semibold text-gray-600">
                  {link.tracking_id}
                </div>
              </div>

              <Link
                href="/orders"
                className="shrink-0 text-sm font-black text-emerald-600 transition hover:text-emerald-700"
              >
                Xem đơn hàng của tôi →
              </Link>
            </div>
          </>
        )}
      </div>

      <MobileNav />
    </main>
  );
}

/* =========================================================
   INSTRUCTION CARD
========================================================= */

function Instruction({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-700">
        {number}
      </div>

      <div className="mt-4 font-black">
        {title}
      </div>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {children}
      </p>
    </div>
  );
}