"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  platform: string;
  product_url: string;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  cashback_percent: number | null;
  sort_order: number;
};

function money(value: number | null) {
  if (value === null || !Number.isFinite(Number(value))) {
    return "";
  }
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function cashback(price: number | null, percent: number | null) {
  if (price === null || percent === null || price <= 0 || percent <= 0) {
    return null;
  }
  return Math.floor((price * percent) / 100);
}

function platformInfo(platform: string) {
  switch (platform.toLowerCase()) {
    case "shopee":
      return {
        name: "Shopee",
        logo: "/platforms/shopee.png",
        badge: "border-orange-200 bg-orange-50 text-orange-600",
      };
    case "lazada":
      return {
        name: "Lazada",
        logo: "/platforms/lazada.png",
        badge: "border-blue-200 bg-blue-50 text-blue-600",
      };
    case "tiktok":
      return {
        name: "TikTok Shop",
        logo: "/platforms/tiktok-shop.png",
        badge: "border-gray-200 bg-white text-gray-900",
      };
    default:
      return {
        name: platform,
        logo: null,
        badge: "border-gray-200 bg-gray-100 text-gray-700",
      };
  }
}

export default function FeaturedProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "shopee" | "lazada" | "tiktok">("all");

  const filteredProducts =
    selectedPlatform === "all"
      ? products
      : products.filter((product) => {
          const platform = product.platform.toLowerCase();
          if (selectedPlatform === "tiktok") {
            return platform === "tiktok" || platform === "tiktok shop" || platform === "tiktok_shop";
          }
          return platform === selectedPlatform;
        });

  const platformTabs = [
    { key: "all" as const, name: "Tất cả", logo: null },
    { key: "shopee" as const, name: "Shopee", logo: "/platforms/shopee.png" },
    { key: "lazada" as const, name: "Lazada", logo: "/platforms/lazada.png" },
    { key: "tiktok" as const, name: "TikTok Shop", logo: "/platforms/tiktok-shop.png" },
  ];

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products/featured", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!active) return;

        if (!response.ok) {
          throw new Error(data?.error || "Không thể tải sản phẩm.");
        }

        setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (err) {
        console.error("Load featured products error:", err);
        if (active) {
          setError("Không thể tải sản phẩm nổi bật.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  async function buyNow(product: Product) {
    if (buyingId) return;

    setError("");
    setBuyingId(product.id);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/login?next=${encodeURIComponent("/")}`);
        return;
      }

      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          url: product.product_url,
          featured_product_id: product.id,
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (data?.code === "PRODUCT_NOT_ELIGIBLE") {
          throw new Error("Sản phẩm này hiện chưa hỗ trợ hoàn tiền. Bạn hãy thử sản phẩm khác.");
        }
        throw new Error(data?.error || "Không thể tạo link hoàn tiền.");
      }

      const trackingId =
        data?.link?.tracking_id ?? data?.trackingId ?? data?.tracking_id;

      if (!trackingId) {
        throw new Error("Không nhận được Tracking ID.");
      }

      router.push(`/san-pham/${encodeURIComponent(trackingId)}`);
    } catch (err) {
      console.error("Create product affiliate link error:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setBuyingId(null);
    }
  }

  if (!loading && products.length === 0 && !error) {
    return null;
  }

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Gợi ý mua sắm
            </div>
            <h2 className="text-xl font-black tracking-tight text-gray-900">
              Sản phẩm bán chạy
            </h2>
          </div>
          {products.length > 0 && (
            <div className="text-xs text-gray-400">
              {filteredProducts.length} sản phẩm
            </div>
          )}
        </div>

        {/* PLATFORM FILTER */}
        {!loading && products.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {platformTabs.map((tab) => {
              const active = selectedPlatform === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedPlatform(tab.key)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-black transition ${
                    active
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {tab.logo && (
                    <img
                      src={tab.logo}
                      alt=""
                      className="h-5 w-5 rounded object-contain"
                    />
                  )}
                  {tab.name}
                </button>
              );
            })}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="aspect-square animate-pulse bg-gray-100" />
                <div className="p-3">
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-9 animate-pulse rounded-xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const info = platformInfo(product.platform);
              const cashbackAmount = cashback(product.price, product.cashback_percent);
              const buying = buyingId === product.id;

              return (
                <article
                  key={product.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* IMAGE */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <div className="absolute left-2.5 top-2.5 z-10">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-2xs ${info.badge}`}>
                        {info.logo ? (
                          <img src={info.logo} alt="" className="h-3.5 w-3.5 object-contain" />
                        ) : (
                          <span>?</span>
                        )}
                        <span className="hidden sm:inline">{info.name}</span>
                      </span>
                    </div>

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-xl font-black text-gray-300">?</span>
                      </div>
                    )}

                    {cashbackAmount !== null && (
                      <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-black text-white shadow-sm">
                        Hoàn {money(cashbackAmount)}₫
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-xs font-bold leading-relaxed text-gray-800">
                      {product.name}
                    </h3>

                    {/* PRICE */}
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {product.price !== null ? (
                        <div className="text-sm font-black text-rose-600">
                          {money(product.price)}₫
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-gray-500">Xem giá trên sàn</div>
                      )}

                      {product.original_price !== null &&
                        product.price !== null &&
                        product.original_price > product.price && (
                          <div className="text-[10px] text-gray-400 line-through">
                            {money(product.original_price)}₫
                          </div>
                        )}
                    </div>

                    {/* CASHBACK BOX */}
                    <div className="mt-2 rounded-xl bg-emerald-50 px-2.5 py-1.5">
                      <div className="text-[10px] font-bold text-emerald-700">Hoàn tiền dự kiến</div>
                      <div className="text-xs font-black text-emerald-600">
                        {cashbackAmount !== null ? `${money(cashbackAmount)}₫` : "Xem khi mua"}
                      </div>
                    </div>

                    {/* BUY BUTTON */}
                    <button
                      type="button"
                      onClick={() => buyNow(product)}
                      disabled={Boolean(buyingId)}
                      className="mt-3 flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-emerald-500 px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {buying ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          <span>Đang tạo...</span>
                        </>
                      ) : (
                        <>
                          <span>Mua ngay</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && products.length > 0 && filteredProducts.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
            <div className="text-sm font-black text-gray-700">
              Chưa có sản phẩm {platformTabs.find((tab) => tab.key === selectedPlatform)?.name}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Sản phẩm sẽ hiển thị tại đây khi được thêm vào danh sách gợi ý.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}