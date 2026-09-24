"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LinkFormProps = {
  compact?: boolean;
  initialUrl?: string;
};

export default function LinkForm({
  compact = false,
  initialUrl = "",
}: LinkFormProps) {
  const router = useRouter();

  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [guideOpen, setGuideOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
  if (compact) return;

  try {
    const hidden =
      localStorage.getItem("cashback_guide_hidden") === "1";

    if (!hidden) {
      setGuideOpen(true);
    }
  } catch {
    setGuideOpen(true);
  }
}, [compact]);

  function closeGuide() {
    if (dontShowAgain) {
      try {
        localStorage.setItem("cashback_guide_hidden", "1");
      } catch {}
    }
    setGuideOpen(false);
  }

  async function submit() {
    setError("");
    setErrorCode("");

    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setError("Vui lòng dán link sản phẩm.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const next = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        );

        router.push(`/login?next=${next}`);
        return;
      }

      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          url: cleanUrl,
        }),
      });

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(
          data?.error ||
            "Không thể tạo link hoàn tiền. Vui lòng thử lại."
        );

        setErrorCode(data?.code || "");
        return;
      }

      const trackingId =
        data?.link?.tracking_id ??
        data?.trackingId ??
        data?.tracking_id;

      if (!trackingId) {
        console.error("Create link response missing tracking ID:", data);
        setError("Đã tạo link nhưng hệ thống không nhận được Tracking ID.");
        setErrorCode("TRACKING_ID_MISSING");
        return;
      }

      router.push(`/san-pham/${encodeURIComponent(trackingId)}`);
    } catch (err) {
      console.error("Create affiliate link error:", err);
      setError("Có lỗi kết nối đến server.");
      setErrorCode("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="w-full">
        <div
          className={
            compact
              ? "flex flex-col gap-3 md:flex-row"
              : "rounded-[28px] border border-gray-200 bg-white p-3 shadow-xl shadow-gray-200/60 md:p-4"
          }
        >
          <div className={compact ? "relative min-w-0 flex-1" : "relative"}>
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 13.5 13.5 10.5M7.5 16.5l-1 1a4.243 4.243 0 0 1-6-6l3-3a4.243 4.243 0 0 1 6 0M16.5 7.5l1-1a4.243 4.243 0 0 1 6 6l-3 3a4.243 4.243 0 0 1-6 0"
                />
              </svg>
            </div>

            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) submit();
              }}
              disabled={loading}
              autoComplete="off"
              inputMode="url"
              placeholder="Dán link sản phẩm Shopee, Lazada, TikTok Shop..."
              className={`w-full border border-gray-200 bg-gray-50 pl-12 pr-4 font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70 ${
                compact
                  ? "h-14 rounded-2xl"
                  : "h-16 rounded-2xl md:pr-44"
              }`}
            />

            {!compact && (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 md:absolute md:right-1 md:top-1 md:mt-0 md:h-14 md:w-auto"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Tạo link hoàn tiền
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

          {compact && (
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-7 text-sm font-black text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Đang tạo...
                </>
              ) : (
                <>
                  Tạo link
                  <span>→</span>
                </>
              )}
            </button>
          )}

          {!compact && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 px-1 pt-3">
              <span className="text-xs font-medium text-gray-400">
                💡 Mua sắm lần đầu?
              </span>

              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="text-xs font-black text-emerald-600 transition hover:text-emerald-700 hover:underline"
              >
                📖 Hướng dẫn nhận hoàn tiền 100%
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className={compact ? "mt-3" : "mt-4"}>
            {errorCode === "PRODUCT_NOT_ELIGIBLE" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    !
                  </div>
                  <div>
                    <div className="font-bold text-amber-950">
                      Sản phẩm chưa hỗ trợ hoàn tiền
                    </div>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Sản phẩm TikTok Shop này hiện chưa có chương trình hoa hồng qua hệ thống.
                      Hãy thử một sản phẩm khác.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {guideOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeGuide();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-emerald-200 bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <h2 className="text-lg font-black text-gray-900 sm:text-xl">
                📖 Quy Trình Hoàn Tiền 100% Thành Công
              </h2>
              <button
                type="button"
                onClick={closeGuide}
                aria-label="Đóng hướng dẫn"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {[
                ["1", "Sao chép link sản phẩm", "Vào ứng dụng Shopee, Lazada hoặc TikTok Shop, chọn sản phẩm cần mua và bấm Chia sẻ → Sao chép liên kết."],
                ["2", "Dán link vào hệ thống", "Dán link vào ô tìm kiếm ở trang chủ, bấm Tạo link hoàn tiền, sau đó nhấn Đi tới Mua Hàng."],
                ["3", "Thanh toán đơn hàng", "Tiến hành mua hàng bình thường trên app. Tiền hoàn sẽ được ghi nhận vào tài khoản sau khi đơn đủ điều kiện."],
              ].map(([number, title, desc]) => (
                <div key={number} className="flex gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                    {number}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-black">⚠️ Lưu ý quan trọng:</div>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-6">
                <li>Không bấm qua link giới thiệu khác sau khi đã lấy link từ hệ thống.</li>
                <li>Thanh toán trên đúng thiết bị vừa mở link mua hàng.</li>
              </ul>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
              Không tự động hiện lại bảng này lần sau
            </label>

            <button
              type="button"
              onClick={closeGuide}
              className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
            >
              TÔI ĐÃ HIỂU & BẮT ĐẦU SĂN SALE! 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
}
