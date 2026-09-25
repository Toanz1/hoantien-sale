"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  starts_at: string;
  expires_at: string;
  destination_url: string | null;
  image_url: string | null;
  is_active: boolean;
};

type FormState = {
  platform: Platform;
  code: string;
  title: string;
  description: string;
  min_order_value: string;
  starts_at: string;
  expires_at: string;
  destination_url: string;
  image_url: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  platform: "shopee",
  code: "",
  title: "",
  description: "",
  min_order_value: "0",
  starts_at: "",
  expires_at: "",
  destination_url: "",
  image_url: "",
  is_active: true,
};

const platformName = (p: Platform) =>
  p === "shopee" ? "Shopee" : p === "lazada" ? "Lazada" : "TikTok Shop";

const platformLogo = (p: Platform) =>
  p === "shopee"
    ? "/platforms/shopee.png"
    : p === "lazada"
      ? "/platforms/lazada.png"
      : "/platforms/tiktok-shop.png";

function toLocal(value: string) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function status(c: Coupon) {
  const now = Date.now();
  if (!c.is_active) return ["Đã tắt", "bg-gray-100 text-gray-600"];
  if (new Date(c.starts_at).getTime() > now)
    return ["Chờ đến giờ", "bg-blue-100 text-blue-700"];
  if (new Date(c.expires_at).getTime() <= now)
    return ["Hết hạn", "bg-red-100 text-red-700"];
  return ["Đang chạy", "bg-emerald-100 text-emerald-700"];
}

export default function AdminCouponsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Coupon[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("starts_at", { ascending: false });

    if (error) setError(error.message);
    else setItems((data || []) as Coupon[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("coupon-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("coupon-images").getPublicUrl(path);
      change("image_url", data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !form.code.trim() ||
      !form.title.trim() ||
      !form.starts_at ||
      !form.expires_at
    ) {
      setError("Nhập đủ mã, tiêu đề, giờ bắt đầu và hết hạn.");
      return;
    }

    if (new Date(form.expires_at) <= new Date(form.starts_at)) {
      setError("Giờ hết hạn phải sau giờ bắt đầu.");
      return;
    }

    setSaving(true);

    const payload = {
      platform: form.platform,
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      min_order_value: Number(form.min_order_value || 0),
      starts_at: new Date(form.starts_at).toISOString(),
      expires_at: new Date(form.expires_at).toISOString(),
      destination_url: form.destination_url.trim() || null,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    const result = editing
      ? await supabase.from("coupons").update(payload).eq("id", editing)
      : await supabase.from("coupons").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setForm(emptyForm);
    setEditing(null);
    await load();
  }

  function edit(c: Coupon) {
    setEditing(c.id);
    setForm({
      platform: c.platform,
      code: c.code,
      title: c.title,
      description: c.description || "",
      min_order_value: String(c.min_order_value || 0),
      starts_at: toLocal(c.starts_at),
      expires_at: toLocal(c.expires_at),
      destination_url: c.destination_url || "",
      image_url: c.image_url || "",
      is_active: c.is_active,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggle(c: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({
        is_active: !c.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", c.id);

    if (error) setError(error.message);
    else await load();
  }

  async function remove(c: Coupon) {
    if (!window.confirm(`Xóa voucher ${c.code}?`)) return;

    const { error } = await supabase.from("coupons").delete().eq("id", c.id);

    if (error) setError(error.message);
    else await load();
  }

  const preview = form.image_url.trim() || platformLogo(form.platform);

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-emerald-600"
            >
              ← Admin Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-black">Quản lý Voucher</h1>
            <p className="mt-1 text-sm text-gray-500">
              Đến giờ tự hiện, hết hạn tự ẩn.
            </p>
          </div>

          <Link
            href="/coupons"
            className="rounded-xl border bg-white px-4 py-2 text-sm font-bold"
          >
            Xem trang voucher →
          </Link>
        </header>

        <form
          onSubmit={submit}
          className="mt-7 rounded-3xl border bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">
              {editing ? "Sửa voucher" : "Thêm voucher"}
            </h2>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-bold text-gray-500"
              >
                Hủy sửa
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Sàn">
              <select
                value={form.platform}
                onChange={(e) =>
                  change("platform", e.target.value as Platform)
                }
                className="input"
              >
                <option value="shopee">Shopee</option>
                <option value="lazada">Lazada</option>
                <option value="tiktok">TikTok Shop</option>
              </select>
            </Field>

            <Field label="Mã voucher">
              <input
                className="input"
                value={form.code}
                onChange={(e) => change("code", e.target.value)}
                placeholder="SALE100"
              />
            </Field>

            <Field label="Tiêu đề">
              <input
                className="input"
                value={form.title}
                onChange={(e) => change("title", e.target.value)}
                placeholder="Giảm 50% - Tối đa 200K"
              />
            </Field>

            <Field label="Đơn tối thiểu">
              <input
                className="input"
                type="number"
                min="0"
                value={form.min_order_value}
                onChange={(e) => change("min_order_value", e.target.value)}
              />
            </Field>

            <Field label="Bắt đầu">
              <input
                className="input"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => change("starts_at", e.target.value)}
              />
            </Field>

            <Field label="Hết hạn">
              <input
                className="input"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => change("expires_at", e.target.value)}
              />
            </Field>

            <Field label="Link Dùng ngay">
              <input
                className="input"
                value={form.destination_url}
                onChange={(e) => change("destination_url", e.target.value)}
                placeholder="https://..."
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Mô tả / điều kiện">
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => change("description", e.target.value)}
                  placeholder="Áp dụng toàn sàn..."
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-black">Ảnh voucher</h3>
            <p className="mt-1 text-xs text-gray-500">
              Bạn có thể tải ảnh từ máy hoặc dán link ảnh. Nếu không có ảnh,
              hệ thống dùng logo của sàn.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-[160px_1fr]">
              <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Xem trước voucher"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = platformLogo(form.platform);
                  }}
                />
              </div>

              <div className="space-y-3">
                <label className="inline-flex cursor-pointer items-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-600">
                  {uploading ? "Đang tải ảnh..." : "Tải ảnh từ máy"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => void uploadImage(e)}
                    className="hidden"
                  />
                </label>

                <div>
                  <div className="mb-1.5 text-xs font-black text-gray-600">
                    Hoặc dán link ảnh
                  </div>
                  <input
                    className="input"
                    value={form.image_url}
                    onChange={(e) => change("image_url", e.target.value)}
                    placeholder="https://example.com/voucher.jpg"
                  />
                </div>

                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => change("image_url", "")}
                    className="text-xs font-black text-red-500"
                  >
                    Xóa ảnh đang chọn
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="mt-4 flex gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => change("is_active", e.target.checked)}
            />
            Cho phép hoạt động theo lịch
          </label>

          <div className="mt-5 flex gap-2">
            <button
              disabled={saving || uploading}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {saving
                ? "Đang lưu..."
                : editing
                  ? "Cập nhật"
                  : "+ Thêm voucher"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border px-5 py-3 text-sm font-black"
              >
                Hủy
              </button>
            )}
          </div>
        </form>

        <section className="mt-7 overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-black">Danh sách voucher</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center">Đang tải...</div>
          ) : !items.length ? (
            <div className="p-10 text-center text-gray-400">
              Chưa có voucher.
            </div>
          ) : (
            <div className="divide-y">
              {items.map((c) => {
                const s = status(c);
                const image = c.image_url || platformLogo(c.platform);

                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={c.title}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = platformLogo(c.platform);
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <b className="text-xs text-emerald-600">
                          {platformName(c.platform)}
                        </b>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black ${s[1]}`}
                        >
                          {s[0]}
                        </span>
                      </div>

                      <div className="mt-1 font-black">
                        {c.title} · {c.code}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(c.starts_at).toLocaleString("vi-VN")} →{" "}
                        {new Date(c.expires_at).toLocaleString("vi-VN")}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => edit(c)}
                        className="rounded-xl border px-4 py-2 text-xs font-black"
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggle(c)}
                        className="rounded-xl border px-4 py-2 text-xs font-black"
                      >
                        {c.is_active ? "Tắt" : "Bật"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void remove(c)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          height: 44px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0 12px;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}
