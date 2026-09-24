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
  if (
    value === null ||
    !Number.isFinite(Number(value))
  ) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function cashback(
  price: number | null,
  percent: number | null
) {
  if (
    price === null ||
    percent === null ||
    price <= 0 ||
    percent <= 0
  ) {
    return null;
  }

  return Math.floor(
    (price * percent) / 100
  );
}

function platformInfo(platform: string) {
  switch (platform.toLowerCase()) {
    case "shopee":
      return {
        name: "Shopee",
        logo: "/platforms/shopee.png",
        badge:
          "border-orange-200 bg-orange-50 text-orange-600",
      };

    case "lazada":
      return {
        name: "Lazada",
        logo: "/platforms/lazada.png",
        badge:
          "border-blue-200 bg-blue-50 text-blue-600",
      };

    case "tiktok":
      return {
        name: "TikTok Shop",
        logo: "/platforms/tiktok-shop.png",
        badge:
          "border-gray-200 bg-white text-gray-900",
      };

    default:
      return {
        name: platform,
        logo: null,
        badge:
          "border-gray-200 bg-gray-100 text-gray-700",
      };
  }
}

export default function FeaturedProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [buyingId, setBuyingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch(
          "/api/products/featured",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Không thể tải sản phẩm."
          );
        }

        setProducts(
          Array.isArray(data?.products)
            ? data.products
            : []
        );
      } catch (err) {
        console.error(
          "Load featured products error:",
          err
        );

        if (active) {
          setError(
            "Không thể tải sản phẩm nổi bật."
          );
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
    if (buyingId) {
      return;
    }

    setError("");
    setBuyingId(product.id);

    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        /*
         * Sau đăng nhập quay lại Home.
         * User có thể bấm sản phẩm lại.
         */
        router.push(
          `/login?next=${encodeURIComponent(
            "/"
          )}`
        );

        return;
      }

      const response = await fetch(
        "/api/links",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            url: product.product_url,

            featured_product_id:
              product.id,
          }),
        }
      );

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (
          data?.code ===
          "PRODUCT_NOT_ELIGIBLE"
        ) {
          throw new Error(
            "Sản phẩm này hiện chưa hỗ trợ hoàn tiền. Bạn hãy thử sản phẩm khác."
          );
        }

        throw new Error(
          data?.error ||
            "Không thể tạo link hoàn tiền."
        );
      }

      const trackingId =
        data?.link?.tracking_id ??
        data?.trackingId ??
        data?.tracking_id;

      if (!trackingId) {
        throw new Error(
          "Không nhận được Tracking ID."
        );
      }

      router.push(
        `/san-pham/${encodeURIComponent(
          trackingId
        )}`
      );
    } catch (err) {
      console.error(
        "Create product affiliate link error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setBuyingId(null);
    }
  }

  if (
    !loading &&
    products.length === 0 &&
    !error
  ) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {/* HEADER */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              Gợi ý mua sắm
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Sản phẩm bán chạy
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Chọn sản phẩm và bắt đầu mua
              hàng qua link có tracking để
              được ghi nhận hoàn tiền.
            </p>
          </div>

          {products.length > 0 && (
            <div className="text-xs font-bold text-gray-400">
              {products.length} sản phẩm
            </div>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white"
              >
                <div className="aspect-square animate-pulse bg-gray-100" />

                <div className="p-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />

                  <div className="mt-3 h-5 w-full animate-pulse rounded bg-gray-100" />

                  <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-gray-100" />

                  <div className="mt-6 h-11 animate-pulse rounded-xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRODUCTS */}

        {!loading &&
          products.length > 0 && (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {products.map((product) => {
                const info =
                  platformInfo(
                    product.platform
                  );

                const cashbackAmount =
                  cashback(
                    product.price,
                    product.cashback_percent
                  );

                const buying =
                  buyingId === product.id;

                return (
                  <article
                    key={product.id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* IMAGE */}

                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <div className="absolute left-3 top-3 z-10">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black shadow-sm sm:text-xs ${info.badge}`}
                        >
                          {info.logo ? (
  <img
    src={info.logo}
    alt=""
    className="h-4 w-4 object-contain"
  />
) : (
  <span>?</span>
)}

<span className="hidden sm:inline">
  {info.name}
</span>
                        </span>
                      </div>

                      {product.image_url ? (
                        <img
                          src={
                            product.image_url
                          }
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <div
  className={`flex h-16 w-16 items-center justify-center rounded-2xl border p-3 ${info.badge}`}
>
  {info.logo ? (
    <img
      src={info.logo}
      alt={info.name}
      className="h-full w-full object-contain"
    />
  ) : (
    <span className="text-2xl font-black">
      ?
    </span>
  )}
</div>
                        </div>
                      )}

                      {cashbackAmount !==
                        null && (
                        <div className="absolute bottom-3 left-3 rounded-xl bg-emerald-500 px-2.5 py-1.5 text-[10px] font-black text-white shadow-lg sm:text-xs">
                          Hoàn{" "}
                          {money(
                            cashbackAmount
                          )}
                          ₫
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 sm:text-xs">
                        {info.name}
                      </div>

                      <h3 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-black leading-5 text-gray-900 sm:min-h-[48px] sm:text-base sm:leading-6">
                        {product.name}
                      </h3>

                      {/* PRICE */}

                      <div className="mt-3">
                        {product.price !==
                        null ? (
                          <div className="text-base font-black text-gray-950 sm:text-xl">
                            {money(
                              product.price
                            )}
                            <span className="ml-0.5 text-xs sm:text-sm">
                              ₫
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-gray-500">
                            Xem giá trên sàn
                          </div>
                        )}

                        {product.original_price !==
                          null &&
                          product.price !==
                            null &&
                          product.original_price >
                            product.price && (
                            <div className="mt-0.5 text-xs text-gray-400 line-through">
                              {money(
                                product.original_price
                              )}
                              ₫
                            </div>
                          )}
                      </div>

                      {/* CASHBACK */}

                      <div className="mt-3 min-h-[44px] rounded-xl bg-emerald-50 px-3 py-2">
                        <div className="text-[10px] font-bold text-emerald-700">
                          Hoàn tiền dự kiến
                        </div>

                        <div className="mt-0.5 text-sm font-black text-emerald-600 sm:text-base">
                          {cashbackAmount !==
                          null
                            ? `${money(
                                cashbackAmount
                              )}₫`
                            : "Xem khi mua"}
                        </div>
                      </div>

                      {/* BUY */}

                      <button
                        type="button"
                        onClick={() =>
                          buyNow(product)
                        }
                        disabled={
                          Boolean(buyingId)
                        }
                        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-xs font-black text-white shadow-sm shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                      >
                        {buying ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                            <span>
                              Đang tạo...
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              Mua ngay
                            </span>

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
      </div>
    </section>
  );
}