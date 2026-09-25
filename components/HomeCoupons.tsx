"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Platform = "shopee" | "lazada" | "tiktok";

type Coupon = {
  id: string;
  platform: Platform;
  code: string;
  title: string;
  description: string | null;
  min_order_value: number;
  expires_at: string;
  destination_url: string | null;
  image_url: string | null;
};

const platformName = (p: Platform) =>
  p === "shopee" ? "Shopee" : p === "lazada" ? "Lazada" : "TikTok Shop";

const platformLogo = (p: Platform) =>
  p === "shopee"
    ? "/platforms/shopee.png"
    : p === "lazada"
      ? "/platforms/lazada.png"
      : "/platforms/tiktok-shop.png";

function money(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function timeLeft(expiresAt: string, now: number) {
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "Đã hết hạn";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);

  if (days > 0) return `Còn ${days} ngày`;

  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `Còn ${hours} giờ`;

  return `Còn ${Math.max(1, minutes)} phút`;
}

export default function HomeCoupons() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("coupons")
      .select(
        "id,platform,code,title,description,min_order_value,expires_at,destination_url,image_url"
      )
      .order("expires_at", { ascending: true })
      .limit(4);

    if (!error) setItems((data || []) as Coupon[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const visible = useMemo(
    () => items.filter((item) => new Date(item.expires_at).getTime() > now).slice(0, 2),
    [items, now]
  );

  async function copyCode(item: Coupon) {
    try {
      await navigator.clipboard.writeText(item.code);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 1500);
    } catch {
      // Trình duyệt không cho clipboard thì không làm gì.
    }
  }

  if (!loading && visible.length === 0) return null;

  return (
    <section className="bg-[#f7f8fa] py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
            Mã giảm giá HOT
          </h2>

          <Link
            href="/coupons"
            className="shrink-0 text-sm font-bold text-emerald-600 hover:text-emerald-700"
          >
            Xem tất cả →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-[126px] animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => {
              const image = item.image_url || platformLogo(item.platform);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex min-h-[124px]">
                    <div className="relative flex w-[126px] shrink-0 flex-col items-center justify-center bg-emerald-500 px-3 py-3 text-white sm:w-[150px]">
                      <div className="flex h-[70px] w-[82px] items-center justify-center overflow-hidden rounded-xl bg-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={item.title}
                          className="h-full w-full object-contain"
                          onError={(event) => {
                            event.currentTarget.src = platformLogo(item.platform);
                          }}
                        />
                      </div>

                      <div className="mt-2 text-xs font-black">
                        {platformName(item.platform)}
                      </div>

                      <div className="absolute inset-y-0 left-[-1px] flex flex-col justify-around">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <span
                            key={index}
                            className="block h-3 w-1.5 rounded-r-full bg-[#f7f8fa]"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 text-base font-black text-gray-900 sm:text-lg">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          Đơn tối thiểu {money(item.min_order_value)}
                        </p>

                        {item.description && (
                          <p className="mt-1 hidden truncate text-xs text-gray-400 lg:block">
                            {item.description}
                          </p>
                        )}

                        <p className="mt-3 text-xs text-gray-400 sm:text-sm">
                          Hết hạn trong: {timeLeft(item.expires_at, now)}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => void copyCode(item)}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-500 px-4 text-xs font-black text-emerald-600 transition hover:bg-emerald-50 sm:text-sm"
                        >
                          {copiedId === item.id ? "Đã lưu ✓" : "Lưu mã"}
                        </button>

                        {item.destination_url ? (
                          <a
                            href={item.destination_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-4 text-xs font-black text-white transition hover:bg-emerald-600 sm:text-sm"
                          >
                            Dùng ngay
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-200 px-4 text-xs font-black text-gray-400 sm:text-sm"
                          >
                            Dùng ngay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
