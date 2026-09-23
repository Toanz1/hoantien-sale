"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PreviewOrder = {
  external_order_id: string;
  tracking_id: string | null;
  status: "pending" | "approved" | "rejected";
  source_status: string;
  product_name: string;
  order_value: number;
  commission: number;
  cashback: number;
  row_count: number;
  matched: boolean;
  reason: string | null;
};

type PreviewResponse = {
  success: boolean;
  error?: string;
  summary?: {
    rows: number;
    orders: number;
    matched: number;
    unmatched: number;
    total_order_value: number;
    total_commission: number;
    total_cashback: number;
    cashback_rate: number;
  };
  orders?: PreviewOrder[];
};

type ImportResponse = {
  success: boolean;
  error?: string;
  summary?: {
    rows: number;
    orders: number;
    imported: number;
    skipped: number;
    wallet_credited: number;
    wallet_reversed: number;
    already_processed: number;
    errors: number;
  };
  errors?: Array<{ external_order_id: string; error: string }>;
};

const money = (value: number) => new Intl.NumberFormat("vi-VN", {
  style: "currency", currency: "VND", maximumFractionDigits: 0,
}).format(Number(value || 0));

function statusLabel(status: PreviewOrder["status"]) {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Đã hủy";
  return "Đang chờ";
}

function statusClass(status: PreviewOrder["status"]) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function reasonLabel(reason: string | null) {
  if (reason === "MISSING_TRACKING") return "Không có tracking";
  if (reason === "TRACKING_NOT_FOUND") return "Tracking chưa tồn tại";
  return reason ?? "";
}

export default function LazadaImportPage() {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState("");

  async function accessToken() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session?.access_token) throw new Error("Phiên đăng nhập đã hết hạn.");
    return data.session.access_token;
  }

  async function send(method: "POST" | "PUT") {
    if (!file) throw new Error("Vui lòng chọn file Lazada .xlsx, .xls hoặc .csv.");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/import/lazada", {
      method,
      headers: { Authorization: `Bearer ${await accessToken()}` },
      body: form,
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.error ?? "Có lỗi xảy ra.");
    return json;
  }

  async function handlePreview() {
    try {
      setLoading(true); setError(""); setResult(null);
      setPreview(await send("POST"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể preview.");
    } finally { setLoading(false); }
  }

  async function handleImport() {
    if (!preview?.summary?.matched) {
      setError("Không có đơn nào match tracking Lazada. Không thể import.");
      return;
    }
    try {
      setImporting(true); setError("");
      setResult(await send("PUT"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể import.");
    } finally { setImporting(false); }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">LAZADA AFFILIATE</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-950">Import Conversion Report</h1>
              <p className="mt-2 text-sm text-gray-500">Hỗ trợ file .xlsx, .xls, .csv. Tracking ưu tiên cột Sub ID 1.</p>
            </div>
            <a href="/admin" className="text-sm font-semibold text-gray-600 hover:text-gray-950">← Admin</a>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-5">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null); setResult(null); setError("");
              }}
              className="block w-full text-sm text-gray-600"
            />
            {file && <p className="mt-3 text-sm font-medium text-gray-700">{file.name}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={handlePreview} disabled={!file || loading || importing}
                className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {loading ? "Đang đọc..." : "Preview"}
              </button>
              <button onClick={handleImport} disabled={!preview?.summary?.matched || importing || loading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {importing ? "Đang import..." : "Import Lazada"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            Vì Conversion Report hiện tại chưa có order thật, status chưa thể xác nhận 100%. Backend chỉ approve/reject khi gặp từ khóa rõ ràng; status lạ sẽ giữ Pending để không cộng ví nhầm.
          </div>
          {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        </div>

        {preview?.summary && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-950">Preview</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              {[
                ["Rows", preview.summary.rows], ["Orders", preview.summary.orders],
                ["Matched", preview.summary.matched], ["Unmatched", preview.summary.unmatched],
                ["Giá trị đơn", money(preview.summary.total_order_value)],
                ["Hoa hồng", money(preview.summary.total_commission)],
                ["Cashback", money(preview.summary.total_cashback)],
                ["Tỷ lệ", `${Math.round(preview.summary.cashback_rate * 100)}%`],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
                  <p className="mt-1 break-words text-lg font-bold text-gray-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-[1050px] w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-400">
                  <tr><th className="p-3">Order</th><th className="p-3">Tracking</th><th className="p-3">Sản phẩm</th><th className="p-3">Status</th><th className="p-3">Lazada status</th><th className="p-3 text-right">Order value</th><th className="p-3 text-right">Commission</th><th className="p-3 text-right">Cashback</th><th className="p-3">Match</th></tr>
                </thead>
                <tbody>
                  {preview.orders?.map((order) => (
                    <tr key={order.external_order_id} className="border-b border-gray-100">
                      <td className="p-3 font-medium">{order.external_order_id}</td>
                      <td className="p-3 font-mono text-xs">{order.tracking_id ?? "-"}</td>
                      <td className="max-w-[260px] truncate p-3">{order.product_name}</td>
                      <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{statusLabel(order.status)}</span></td>
                      <td className="p-3 text-gray-500">{order.source_status || "-"}</td>
                      <td className="p-3 text-right">{money(order.order_value)}</td>
                      <td className="p-3 text-right">{money(order.commission)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600">{money(order.cashback)}</td>
                      <td className="p-3">{order.matched ? <span className="font-semibold text-emerald-600">Matched</span> : <span className="text-red-600">{reasonLabel(order.reason)}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {result?.summary && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-950">Kết quả import</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
              {[
                ["Imported", result.summary.imported], ["Skipped", result.summary.skipped],
                ["Cộng ví", result.summary.wallet_credited], ["Hoàn cashback", result.summary.wallet_reversed],
                ["Đã xử lý", result.summary.already_processed], ["Errors", result.summary.errors],
                ["Orders", result.summary.orders],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-950">{value}</p>
                </div>
              ))}
            </div>
            {!!result.errors?.length && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {result.errors.map((item) => <p key={`${item.external_order_id}-${item.error}`}>{item.external_order_id}: {item.error}</p>)}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
