"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Platform = "shopee" | "lazada" | "tiktok";

type Product = {
  id: string;
  name: string;
  platform: Platform;
  product_url: string;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  cashback_percent: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ProductForm = {
  name: string;
  platform: Platform;
  product_url: string;
  image_url: string;
  price: string;
  original_price: string;
  cashback_percent: string;
  is_active: boolean;
  sort_order: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  platform: "shopee",
  product_url: "",
  image_url: "",
  price: "",
  original_price: "",
  cashback_percent: "",
  is_active: true,
  sort_order: "0",
};

function money(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateCashback(price: number | null, percent: number | null) {
  if (price === null || percent === null || price <= 0 || percent <= 0) return 0;
  return Math.floor((price * percent) / 100);
}

function platformLabel(platform: Platform) {
  if (platform === "shopee") return "Shopee";
  if (platform === "lazada") return "Lazada";
  return "TikTok Shop";
}

function platformClass(platform: Platform) {
  if (platform === "shopee") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  if (platform === "lazada") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-gray-100 text-gray-800 border-gray-200";
}

export default function AdminProductsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();

    const token = data.session?.access_token;

    if (!token) {
      window.location.href = "/login";
      throw new Error("UNAUTHORIZED");
    }

    return token;
  }, [supabase]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await fetch("/api/admin/products", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể tải danh sách sản phẩm."
        );
      }

      setProducts(data.products ?? []);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "UNAUTHORIZED"
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi khi tải sản phẩm."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function updateForm<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreate() {
    setEditing(null);
    setDeleting(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setDeleting(null);

    setForm({
      name: product.name,
      platform: product.platform,
      product_url: product.product_url,
      image_url: product.image_url ?? "",
      price:
        product.price === null
          ? ""
          : String(product.price),
      original_price:
        product.original_price === null
          ? ""
          : String(product.original_price),
      cashback_percent:
        product.cashback_percent === null
          ? ""
          : String(product.cashback_percent),
      is_active: product.is_active,
      sort_order: String(product.sort_order ?? 0),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function saveProduct() {
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (!form.product_url.trim()) {
      setError("Vui lòng nhập link sản phẩm.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      const body = {
        name: form.name.trim(),
        platform: form.platform,
        product_url: form.product_url.trim(),

        image_url:
          form.image_url.trim() || null,

        price:
          form.price.trim() === ""
            ? null
            : Number(form.price),

        original_price:
          form.original_price.trim() === ""
            ? null
            : Number(form.original_price),

        cashback_percent:
          form.cashback_percent.trim() === ""
            ? null
            : Number(form.cashback_percent),

        is_active: form.is_active,

        sort_order:
          form.sort_order.trim() === ""
            ? 0
            : Number(form.sort_order),
      };

      const url = editing
        ? `/api/admin/products/${editing.id}`
        : "/api/admin/products";

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Không thể lưu sản phẩm."
        );
      }

      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);

      setSuccess(
        editing
          ? "Đã cập nhật sản phẩm."
          : "Đã thêm sản phẩm."
      );

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu sản phẩm."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    try {
      setError("");
      setSuccess("");

      const token = await getToken();

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: product.name,
            platform: product.platform,
            product_url: product.product_url,
            image_url: product.image_url,
            price: product.price,
            original_price:
              product.original_price,
            cashback_percent:
              product.cashback_percent,
            sort_order: product.sort_order,
            is_active: !product.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Không thể thay đổi trạng thái."
        );
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                is_active: !product.is_active,
              }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể thay đổi trạng thái."
      );
    }
  }

  async function deleteProduct() {
    if (!deleting) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      const response = await fetch(
        `/api/admin/products/${deleting.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Không thể xóa sản phẩm."
        );
      }

      setProducts((current) =>
        current.filter(
          (item) => item.id !== deleting.id
        )
      );

      setDeleting(null);
      setSuccess("Đã xóa sản phẩm.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa sản phẩm."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* HEADER */}

        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Sản phẩm trang chủ
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Quản lý sản phẩm nổi bật hiển thị cho
              người dùng.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Đang tải..." : "↻ Làm mới"}
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
            >
              + Thêm sản phẩm
            </button>
          </div>
        </header>

        {/* MESSAGE */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-black"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-black"
            >
              ×
            </button>
          </div>
        )}

        {/* SUMMARY */}

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Tổng sản phẩm"
            value={products.length}
          />

          <SummaryCard
            label="Đang hiển thị"
            value={
              products.filter(
                (product) => product.is_active
              ).length
            }
          />

          <SummaryCard
            label="Đang ẩn"
            value={
              products.filter(
                (product) => !product.is_active
              ).length
            }
          />
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-black">
              Danh sách sản phẩm
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Sản phẩm có thứ tự nhỏ hơn sẽ được ưu
              tiên hiển thị trước.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500" />

                <div className="mt-3 text-sm font-medium text-gray-400">
                  Đang tải sản phẩm...
                </div>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-2xl">
                📦
              </div>

              <h3 className="mt-5 font-black">
                Chưa có sản phẩm
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Thêm sản phẩm Shopee, Lazada hoặc
                TikTok Shop để hiển thị trên trang
                chủ.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-white"
              >
                + Thêm sản phẩm đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">
                      Sản phẩm
                    </th>

                    <th className="px-5 py-4">
                      Sàn
                    </th>

                    <th className="px-5 py-4">
                      Giá
                    </th>

                    <th className="px-5 py-4">
                      Hoàn tiền
                    </th>

                    <th className="px-5 py-4 text-center">
                      Thứ tự
                    </th>

                    <th className="px-5 py-4">
                      Hiển thị
                    </th>

                    <th className="px-5 py-4 text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-[300px] items-center gap-4">
                          <ProductImage
                            src={product.image_url}
                            name={product.name}
                          />

                          <div className="min-w-0">
                            <div className="max-w-[330px] truncate font-black text-gray-900">
                              {product.name}
                            </div>

                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block max-w-[330px] truncate text-xs text-gray-400 hover:text-emerald-600"
                            >
                              {product.product_url}
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${platformClass(
                            product.platform
                          )}`}
                        >
                          {platformLabel(
                            product.platform
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-black text-gray-900">
                          {money(product.price)}
                        </div>

                        {product.original_price !==
                          null &&
                          product.original_price !==
                            product.price && (
                            <div className="mt-1 text-xs text-gray-400 line-through">
                              {money(
                                product.original_price
                              )}
                            </div>
                          )}
                      </td>

                      <td className="px-5 py-4">
                        {product.price !== null &&
                        product.cashback_percent !== null ? (
                          <div>
                            <div className="font-black text-emerald-600">
                              {money(
                                calculateCashback(
                                  product.price,
                                  product.cashback_percent
                                )
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              {product.cashback_percent}% giá bán
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-4 text-center font-black">
                        {product.sort_order}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(product)
                          }
                          className={`relative h-7 w-12 rounded-full transition ${
                            product.is_active
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                          title={
                            product.is_active
                              ? "Đang hiển thị"
                              : "Đang ẩn"
                          }
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                              product.is_active
                                ? "left-6"
                                : "left-1"
                            }`}
                          />
                        </button>

                        <div className="mt-1 text-xs text-gray-400">
                          {product.is_active
                            ? "Đang hiện"
                            : "Đang ẩn"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(product)
                            }
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold transition hover:bg-gray-50"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setSuccess("");
                              setDeleting(product);
                            }}
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* CREATE / EDIT MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center py-6">
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-black">
                    {editing
                      ? "Sửa sản phẩm"
                      : "Thêm sản phẩm"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Sản phẩm sẽ được dùng tại khu sản
                    phẩm nổi bật trên trang chủ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500 transition hover:bg-gray-200"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[72vh] overflow-y-auto p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Tên sản phẩm"
                    required
                    className="sm:col-span-2"
                  >
                    <input
                      value={form.name}
                      onChange={(e) =>
                        updateForm(
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Ví dụ: Tai nghe Bluetooth..."
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Sàn"
                    required
                  >
                    <select
                      value={form.platform}
                      onChange={(e) =>
                        updateForm(
                          "platform",
                          e.target
                            .value as Platform
                        )
                      }
                      className={inputClass}
                    >
                      <option value="shopee">
                        Shopee
                      </option>

                      <option value="lazada">
                        Lazada
                      </option>

                      <option value="tiktok">
                        TikTok Shop
                      </option>
                    </select>
                  </Field>

                  <Field label="Thứ tự hiển thị">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.sort_order}
                      onChange={(e) =>
                        updateForm(
                          "sort_order",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Link sản phẩm"
                    required
                    className="sm:col-span-2"
                    hint="Dán link sản phẩm gốc. Hệ thống sẽ tạo affiliate/tracking khi khách mua."
                  >
                    <input
                      type="url"
                      value={form.product_url}
                      onChange={(e) =>
                        updateForm(
                          "product_url",
                          e.target.value
                        )
                      }
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="URL ảnh"
                    className="sm:col-span-2"
                  >
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) =>
                        updateForm(
                          "image_url",
                          e.target.value
                        )
                      }
                      placeholder="https://.../image.jpg"
                      className={inputClass}
                    />
                  </Field>

                  {form.image_url.trim() && (
                    <div className="sm:col-span-2">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 text-xs font-bold text-gray-500">
                          Xem trước ảnh
                        </div>

                        <ProductImage
                          src={form.image_url}
                          name={
                            form.name ||
                            "Sản phẩm"
                          }
                          large
                        />
                      </div>
                    </div>
                  )}

                  <Field label="Giá bán">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) =>
                          updateForm(
                            "price",
                            e.target.value
                          )
                        }
                        placeholder="199000"
                        className={`${inputClass} pr-14`}
                      />

                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-gray-400">
                        VNĐ
                      </span>
                    </div>
                  </Field>

                  <Field label="Giá gốc">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={
                          form.original_price
                        }
                        onChange={(e) =>
                          updateForm(
                            "original_price",
                            e.target.value
                          )
                        }
                        placeholder="299000"
                        className={`${inputClass} pr-14`}
                      />

                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-gray-400">
                        VNĐ
                      </span>
                    </div>
                  </Field>

                  <Field
                    label="% hoàn cho khách"
                    className="sm:col-span-2"
                    hint="Nhập phần trăm hoàn. Ví dụ: 10 nghĩa là hoàn 10% giá bán."
                  >
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form.cashback_percent}
                        onChange={(e) =>
                          updateForm(
                            "cashback_percent",
                            e.target.value
                          )
                        }
                        placeholder="Ví dụ: 10"
                        className={`${inputClass} pr-14`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-black text-gray-400">
                        %
                      </span>
                    </div>

                    {Number(form.price) > 0 &&
                      Number(form.cashback_percent) > 0 && (
                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="text-xs font-bold text-emerald-700">
                            Khách được hoàn dự kiến
                          </div>
                          <div className="mt-1 text-2xl font-black text-emerald-600">
                            {money(
                              calculateCashback(
                                Number(form.price),
                                Number(form.cashback_percent)
                              )
                            )}
                          </div>
                          <div className="mt-1 text-xs text-emerald-700/70">
                            Tính theo giá bán {money(Number(form.price))}
                          </div>
                        </div>
                      )}
                  </Field>

                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <div className="text-sm font-black text-gray-900">
                          Hiển thị trên trang chủ
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Tắt nếu bạn muốn giữ sản
                          phẩm nhưng tạm thời không
                          hiển thị.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          updateForm(
                            "is_active",
                            !form.is_active
                          )
                        }
                        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                          form.is_active
                            ? "bg-emerald-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            form.is_active
                              ? "left-6"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={saveProduct}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving
                    ? "Đang lưu..."
                    : editing
                    ? "Lưu thay đổi"
                    : "Thêm sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleting && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl">
              🗑️
            </div>

            <h2 className="mt-5 text-xl font-black">
              Xóa sản phẩm?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Bạn đang xóa{" "}
              <strong className="text-gray-900">
                {deleting.name}
              </strong>
              . Thao tác này không thể hoàn tác.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleting(null)
                }
                disabled={saving}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={deleteProduct}
                disabled={saving}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {saving
                  ? "Đang xóa..."
                  : "Xóa sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

function Field({
  label,
  required = false,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-bold text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <div className="mt-1.5 text-xs leading-5 text-gray-400">
          {hint}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold text-gray-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>
    </div>
  );
}

function ProductImage({
  src,
  name,
  large = false,
}: {
  src: string | null;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] =
    useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const size = large
    ? "h-28 w-28"
    : "h-16 w-16";

  if (!src || failed) {
    return (
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-xl`}
      >
        📦
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-2xl border border-gray-200 bg-white object-cover`}
    />
  );
}