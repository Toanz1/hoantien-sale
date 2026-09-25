"use client";







import { useCallback, useEffect, useMemo, useState } from "react";



import Link from "next/link";



import { useRouter } from "next/navigation";



import BrandLogo from "@/components/BrandLogo";



import HomeAuthNav from "@/components/HomeAuthNav";



import { createClient } from "@/lib/supabase/client";







type LinkHistoryItem = {



  id: string;



  platform: string | null;



  original_url: string | null;



  affiliate_url: string | null;



  tracking_id: string | null;



  product_name: string | null;



  product_image_url: string | null;



  product_price?: number | null;



  product_original_price?: number | null;



  cashback_percent?: number | null;



  created_at: string;



};







function platformLabel(p: string | null) {
  const value = (p || "").toLowerCase();

  if (value === "shopee") return "Shopee";
  if (value === "lazada") return "Lazada";
  if (value === "tiktok" || value === "tiktokshop" || value === "tiktok_shop") {
    return "TikTok Shop";
  }

  return p || "Khác";
}

function platformLogo(platform: string | null) {

  const p = normalizedPlatform(platform);



  if (p === "shopee") return "/platforms/shopee.png";

  if (p === "lazada") return "/platforms/lazada.png";

  if (p === "tiktok") return "/platforms/tiktok-shop.png";



  return "/platforms/hoantiensale.png";

}







function formatDate(v: string) {



  try {



    return new Intl.DateTimeFormat("vi-VN", {



      hour: "2-digit",



      minute: "2-digit",



      day: "2-digit",



      month: "2-digit",



      year: "numeric",



    }).format(new Date(v));



  } catch {



    return v;



  }



}







function formatMoney(value: number | null | undefined) {



  if (value == null || !Number.isFinite(Number(value))) return null;



  return new Intl.NumberFormat("vi-VN").format(Number(value)) + "đ";



}







function shortUrl(v: string | null) {



  if (!v) return "Không có link";



  try {



    const u = new URL(v);



    return `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`;



  } catch {



    return v;



  }



}







function normalizedPlatform(value: string | null) {



  const p = (value || "").toLowerCase();



  if (p === "tiktokshop" || p === "tiktok_shop") return "tiktok";



  return p;



}

export default function LinkHistoryPage() {



  const router = useRouter();



  const [items, setItems] = useState<LinkHistoryItem[]>([]);



  const [loading, setLoading] = useState(true);



  const [error, setError] = useState("");



  const [copiedId, setCopiedId] = useState<string | null>(null);



  const [platform, setPlatform] = useState("all");







  const loadHistory = useCallback(async () => {



    setLoading(true);



    setError("");







    try {



      const supabase = createClient();



      const {



        data: { session },



      } = await supabase.auth.getSession();







      if (!session) {



        router.replace(`/login?next=${encodeURIComponent("/link-history")}`);



        return;



      }







      const response = await fetch("/api/links/history", {



        headers: {



          Authorization: `Bearer ${session.access_token}`,



        },



        cache: "no-store",



      });







      const data = await response.json().catch(() => null);







      if (response.status === 401) {



        router.replace(`/login?next=${encodeURIComponent("/link-history")}`);



        return;



      }







      if (!response.ok) {



        throw new Error(data?.error || "Không thể tải lịch sử link.");



      }







      setItems(Array.isArray(data?.links) ? data.links : []);



    } catch (e) {



      setError(



        e instanceof Error ? e.message : "Không thể tải lịch sử link."



      );



    } finally {



      setLoading(false);



    }



  }, [router]);







  useEffect(() => {



    void loadHistory();



  }, [loadHistory]);







  const filtered = useMemo(() => {



    if (platform === "all") return items;



    return items.filter(



      (item) => normalizedPlatform(item.platform) === platform



    );



  }, [items, platform]);







  async function copyLink(item: LinkHistoryItem) {



    const value = item.affiliate_url || item.original_url;



    if (!value) return;







    try {



      await navigator.clipboard.writeText(value);



      setCopiedId(item.id);







      window.setTimeout(() => {



        setCopiedId((current) => (current === item.id ? null : current));



      }, 1600);



    } catch {



      setError("Không thể sao chép link trên trình duyệt này.");



    }



  }







  return (



    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">



      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">



        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">



          <BrandLogo />







          <Link



            href="/"



            className="hidden text-xs font-bold text-gray-600 transition hover:text-emerald-600 md:block"



          >





          </Link>







          <div className="flex justify-end">



            <HomeAuthNav />



          </div>



        </div>



      </header>







      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">



        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">



          <div>



            <Link



              href="/"



              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"



            >



              ← Về trang chủ



            </Link>







            <h1 className="mt-2 text-2xl font-black sm:text-3xl">



              Lịch sử link



            </h1>







            <p className="mt-1 text-sm text-gray-500">



              Các link hoàn tiền bạn đã tạo trên hệ thống.



            </p>



          </div>







          <Link



            href="/"



            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-black text-white transition hover:bg-emerald-600"



          >



            + Tạo link mới



          </Link>



        </div>







        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">



          <div className="flex gap-2 overflow-x-auto">



            {[



              ["all", "Tất cả"],



              ["shopee", "Shopee"],



              ["lazada", "Lazada"],



              ["tiktok", "TikTok Shop"],



            ].map(([value, label]) => (



              <button



                key={value}



                type="button"



                onClick={() => setPlatform(value)}



                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition ${



                  platform === value



                    ? "bg-emerald-500 text-white"



                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"



                }`}



              >



                {label}



              </button>



            ))}



          </div>



        </div>







        {error && (



          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">



            {error}



            <button



              type="button"



              onClick={() => void loadHistory()}



              className="ml-3 font-black underline"



            >



              Thử lại



            </button>



          </div>



        )}







        {loading ? (



          <div className="mt-5 space-y-3">



            {[1, 2, 3].map((x) => (



              <div



                key={x}



                className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white"



              />



            ))}



          </div>



        ) : filtered.length === 0 ? (



          <div className="mt-5 rounded-[24px] border border-dashed border-gray-300 bg-white px-5 py-14 text-center">



            <div className="text-3xl">🔗</div>



            <h2 className="mt-4 text-lg font-black">Chưa có link nào</h2>



            <p className="mt-1 text-sm text-gray-500">



              Link đã tạo sẽ xuất hiện tại đây.



            </p>



            <Link



              href="/"



              className="mt-5 inline-flex h-11 items-center rounded-xl bg-emerald-500 px-5 text-sm font-black text-white"



            >



              Tạo link hoàn tiền



            </Link>



          </div>



        ) : (



          <div className="mt-5 space-y-3">



            {filtered.map((item) => {



              const price = formatMoney(item.product_price);



              const oldPrice = formatMoney(item.product_original_price);







              return (



                <article



                  key={item.id}



                  className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5"



                >



                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">



                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-3">
                      {/* Không có API sản phẩm thì dùng logo sàn làm ảnh đại diện. */}
                      <img
                        src={platformLogo(item.platform)}
                        alt={platformLabel(item.platform)}
                        className="h-full w-full object-contain"
                      />
                    </div>







                    <div className="min-w-0 flex-1">



                      <div className="flex flex-wrap items-center gap-2">



                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">



                          {platformLabel(item.platform)}



                        </span>



                        <span className="text-[11px] font-medium text-gray-400">



                          {formatDate(item.created_at)}



                        </span>



                      </div>







                      <h2 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-gray-900 sm:text-base">



                        {item.product_name || `Link ${platformLabel(item.platform)}`}



                      </h2>







                      {(price || oldPrice) && (



                        <div className="mt-2 flex flex-wrap items-center gap-2">



                          {price && (



                            <span className="text-sm font-black text-red-500">



                              {price}



                            </span>



                          )}



                          {oldPrice && oldPrice !== price && (



                            <span className="text-xs font-medium text-gray-400 line-through">



                              {oldPrice}



                            </span>



                          )}



                        </div>



                      )}







                      <p



                        title={item.original_url || ""}



                        className="mt-2 truncate text-xs text-gray-400"



                      >



                        {shortUrl(item.original_url)}



                      </p>



                    </div>







                    <div className="flex shrink-0 flex-wrap gap-2">



                      <button



                        type="button"



                        onClick={() => void copyLink(item)}



                        disabled={!item.affiliate_url && !item.original_url}



                        className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-xs font-black text-gray-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"



                      >



                        {copiedId === item.id



                          ? "Đã sao chép ✓"



                          : "Sao chép"}



                      </button>







                      {item.tracking_id && (



                        <Link



                          href={`/san-pham/${encodeURIComponent(



                            item.tracking_id



                          )}`}



                          className="inline-flex h-10 items-center rounded-xl bg-emerald-500 px-4 text-xs font-black text-white transition hover:bg-emerald-600"



                        >



                          Xem link



                        </Link>



                      )}



                    </div>



                  </div>



                </article>



              );



            })}



          </div>



        )}



      </section>



    </main>



  );



}
