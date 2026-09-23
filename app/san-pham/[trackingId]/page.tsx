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
  created_at?: string | null;
};

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
        className:
          "border-orange-200 bg-orange-50 text-orange-600",
      };

    case "lazada":
      return {
        icon: "L",
        className:
          "border-blue-200 bg-blue-50 text-blue-600",
      };

    default:
      return {
        icon: "♪",
        className:
          "border-gray-200 bg-gray-100 text-gray-950",
      };
  }
}

export default function ProductResultPage() {
  const params = useParams();
  const router = useRouter();

  const rawTrackingId = params?.trackingId;

  const trackingId = Array.isArray(rawTrackingId)
    ? rawTrackingId[0]
    : rawTrackingId;

  const [link, setLink] =
    useState<AffiliateLink | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!trackingId) {
      setError("Tracking ID không hợp lệ.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadAffiliateLink() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (userError || !user) {
          router.replace(
            `/login?next=${encodeURIComponent(
              `/san-pham/${trackingId}`
            )}`
          );
          return;
        }

        const {
          data,
          error: queryError,
        } = await supabase
          .from("affiliate_links")
          .select(
            `
              id,
              user_id,
              platform,
              tracking_id,
              original_url,
              affiliate_url,
              created_at
            `
          )
          .eq("user_id", user.id)
          .eq("tracking_id", trackingId)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (queryError) {
          console.error(
            "Load affiliate link error:",
            queryError
          );

          setError(
            "Không thể tải thông tin link hoàn tiền."
          );

          return;
        }

        if (!data) {
          setError(
            "Không tìm thấy link hoàn tiền này hoặc link không thuộc tài khoản của bạn."
          );

          return;
        }

        setLink(data as AffiliateLink);
      } catch (err) {
        console.error(
          "Load product result error:",
          err
        );

        if (active) {
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

    loadAffiliateLink();

    return () => {
      active = false;
    };
  }, [trackingId, router]);

  async function copyLink() {
    if (!link?.affiliate_url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        link.affiliate_url
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy affiliate link error:", err);

      setError(
        "Không thể sao chép link. Bạn vui lòng thử lại."
      );
    }
  }

  function buyNow() {
    if (!link?.affiliate_url) {
      return;
    }

    window.location.href = link.affiliate_url;
  }

  const platformStyle = link
    ? getPlatformStyle(link.platform)
    : null;

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-24 text-gray-900 md:pb-0">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 font-black text-white">
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
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 sm:text-sm"
          >
            ← Trang chủ
          </Link>
        </div>
      </header>

      {/* SEARCH AGAIN */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-2 text-xs font-bold text-gray-500">
              Muốn tìm sản phẩm khác?
            </div>

            <LinkForm compact />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 md:py-10">
        {/* BACK */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-950"
        >
          <span>←</span>
          Quay lại
        </button>

        {/* LOADING */}
        {loading && (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="aspect-square animate-pulse rounded-[32px] bg-gray-200" />

            <div className="rounded-[32px] border border-gray-200 bg-white p-6 sm:p-8">
              <div className="h-6 w-28 animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-6 h-9 w-3/4 animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-3 h-5 w-full animate-pulse rounded-lg bg-gray-100" />
              <div className="mt-8 h-28 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && !link && (
          <div className="mx-auto max-w-2xl rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-sm">
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
              className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white"
            >
              Về trang chủ
            </Link>
          </div>
        )}

        {/* PRODUCT */}
        {!loading && link && (
          <>
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              {/* LEFT */}
              <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                  <div className="text-center">
                    {platformStyle && (
                      <div
                        className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border text-4xl font-black shadow-sm ${platformStyle.className}`}
                      >
                        {platformStyle.icon}
                      </div>
                    )}

                    <div className="mt-5 text-xl font-black">
                      {getPlatformName(
                        link.platform
                      )}
                    </div>

                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                      Link mua hàng đã được tạo riêng cho
                      tài khoản của bạn.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Tracking ID
                  </div>

                  <div className="mt-2 break-all font-mono text-sm font-semibold text-gray-700">
                    {link.tracking_id}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                    ✓ Link hoàn tiền đã sẵn sàng
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
                    {getPlatformName(
                      link.platform
                    )}
                  </span>
                </div>

                <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                  Tiếp tục mua hàng để được ghi nhận hoàn tiền
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500">
                  Hãy đi đến sản phẩm bằng link bên dưới và
                  hoàn tất đơn hàng trên sàn. Khi đơn được
                  hệ thống ghi nhận và đối soát, trạng thái
                  sẽ xuất hiện trong mục Đơn hàng.
                </p>

                {/* AFFILIATE LINK */}
                {link.affiliate_url ? (
                  <>
                    <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-700">
                        Link mua hàng của bạn
                      </div>

                      <div className="mt-2 line-clamp-3 break-all text-sm leading-6 text-gray-700">
                        {link.affiliate_url}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={buyNow}
                      className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
                    >
                      <span>🛒</span>
                      Mua ngay
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={copyLink}
                      className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 text-sm font-black text-gray-800 transition hover:bg-gray-50"
                    >
                      {copied ? (
                        <>
                          <span className="text-emerald-600">
                            ✓
                          </span>
                          Đã sao chép link
                        </>
                      ) : (
                        <>
                          <span>🔗</span>
                          Sao chép link mua hàng
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                    Link mua hàng hiện chưa sẵn sàng. Bạn
                    vui lòng quay lại và thử tạo link khác.
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* ORIGINAL URL */}
                {link.original_url && (
                  <div className="mt-7 border-t border-gray-100 pt-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Link sản phẩm ban đầu
                    </div>

                    <div className="mt-2 line-clamp-2 break-all text-xs leading-5 text-gray-500">
                      {link.original_url}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NOTICE */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  1
                </div>

                <div className="mt-4 font-black">
                  Bấm Mua ngay
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Bắt đầu phiên mua hàng bằng link được tạo
                  trên Hoàn Tiền Sale.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  2
                </div>

                <div className="mt-4 font-black">
                  Hoàn tất đơn hàng
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Chọn sản phẩm và thanh toán trên sàn như
                  cách bạn vẫn mua hàng.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  3
                </div>

                <div className="mt-4 font-black">
                  Theo dõi tiền hoàn
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Kiểm tra trạng thái đơn và tiền hoàn trong
                  mục Đơn hàng của tài khoản.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                href="/orders"
                className="text-sm font-black text-emerald-600 hover:text-emerald-700"
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