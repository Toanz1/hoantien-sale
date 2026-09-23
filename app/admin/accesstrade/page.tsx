"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Result = any;

export default function AccessTradeAdminPage() {
  const [days, setDays] = useState("30");
  const [limit, setLimit] = useState("100");
  const [trackingId, setTrackingId] = useState("");

  const [rawResult, setRawResult] = useState<Result>(null);
  const [syncResult, setSyncResult] = useState<Result>(null);

  const [loadingRaw, setLoadingRaw] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [mockLoading, setMockLoading] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error("Không thể lấy phiên đăng nhập.");
    }

    if (!session?.access_token) {
      throw new Error(
        "Bạn chưa đăng nhập hoặc phiên đã hết hạn."
      );
    }

    return session.access_token;
  }

  async function getTransactions() {
    setLoadingRaw(true);
    setError(null);
    setRawResult(null);

    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({
        days,
        limit,
        page: "1",
      });

      const response = await fetch(
        `/api/admin/accesstrade/debug/raw?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();
      setRawResult(data);

      if (!response.ok) {
        setError(data?.error || "Không thể lấy transactions.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra."
      );
    } finally {
      setLoadingRaw(false);
    }
  }

  async function syncTransactions() {
    setLoadingSync(true);
    setError(null);
    setSyncResult(null);

    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({
        days,
        limit,
      });

      const response = await fetch(
        `/api/admin/accesstrade/sync?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();
      setSyncResult(data);

      if (!response.ok) {
        setError(data?.error || "Không thể sync ACCESSTRADE.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra."
      );
    } finally {
      setLoadingSync(false);
    }
  }

  async function runMockSync(status: 0 | 1 | 2) {
    const cleanTrackingId = trackingId.trim();

    if (!cleanTrackingId) {
      setError(
        "Nhập Tracking ID của một affiliate_links platform=tiktok."
      );
      return;
    }

    setMockLoading(status);
    setError(null);
    setSyncResult(null);

    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({
        mock: "1",
        tracking_id: cleanTrackingId,
        mock_status: String(status),
      });

      const response = await fetch(
        `/api/admin/accesstrade/sync?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();
      setSyncResult(data);

      if (!response.ok) {
        setError(data?.error || "Không thể chạy mock sync.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra."
      );
    } finally {
      setMockLoading(null);
    }
  }

  const summary = syncResult?.summary;
  const isDevelopment =
  process.env.NODE_ENV === "development";
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            TikTok Shop · ACCESSTRADE
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            ACCESSTRADE Transaction Center
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Chỉ đồng bộ TikTok Shop. Shopee và Lazada không đi qua
            ACCESSTRADE.
          </p>
        </div>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">
              Live ACCESSTRADE
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Lấy transaction thật và sync các transaction có tracking
              khớp link TikTok của hệ thống.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Số ngày
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Limit
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={getTransactions}
                disabled={
                  loadingRaw || loadingSync || mockLoading !== null
                }
                className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loadingRaw ? "Đang lấy..." : "Lấy transactions"}
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={syncTransactions}
                disabled={
                  loadingSync || loadingRaw || mockLoading !== null
                }
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loadingSync
                  ? "Đang sync..."
                  : "Sync TikTok / ACCESSTRADE"}
              </button>
            </div>
          </div>
        </section>

        {isDevelopment && (
  <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="font-semibold text-amber-900">
        Mock test — TikTok Orders & Cashback
      </h2>

      <p className="mt-1 text-sm text-amber-800">
        Chỉ chạy ngoài production. Dùng cùng một Tracking ID TikTok
        để test Pending → Approved → Approved lần 2 → Rejected →
        Rejected lần 2.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-5">
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-amber-900">
          Tracking ID TikTok
        </label>

        <input
          type="text"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Dán tracking_id platform=tiktok"
          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-amber-600"
        />
      </div>

      <div className="flex items-end">
        <button
          onClick={() => runMockSync(0)}
          disabled={
            mockLoading !== null || loadingRaw || loadingSync
          }
          className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {mockLoading === 0 ? "Đang test..." : "Mock Pending"}
        </button>
      </div>

      <div className="flex items-end">
        <button
          onClick={() => runMockSync(1)}
          disabled={
            mockLoading !== null || loadingRaw || loadingSync
          }
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {mockLoading === 1
            ? "Đang test..."
            : "Mock Approved"}
        </button>
      </div>

      <div className="flex items-end">
        <button
          onClick={() => runMockSync(2)}
          disabled={
            mockLoading !== null || loadingRaw || loadingSync
          }
          className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {mockLoading === 2
            ? "Đang test..."
            : "Mock Rejected"}
        </button>
      </div>
    </div>

    <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-sm text-amber-900">
      Mock dùng commission <strong>25.000 ₫</strong>, cashback{" "}
      <strong>70%</strong> = <strong>17.500 ₫</strong>. Backend
      dùng RPC <code>apply_order_cashback()</code> để chống cộng
      tiền và reversal trùng.
    </div>
  </section>
)}

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="font-semibold text-red-700">API lỗi</div>
            <div className="mt-1 text-sm text-red-600">{error}</div>
          </section>
        )}

        {summary && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <SummaryCard
              label="TikTok links"
              value={summary.tiktok_affiliate_links ?? 0}
            />
            <SummaryCard
              label="Transactions"
              value={summary.transactions ?? 0}
            />
            <SummaryCard
              label="Synced"
              value={summary.synced ?? 0}
            />
            <SummaryCard
              label="Skipped"
              value={summary.skipped ?? 0}
            />
            <SummaryCard
              label="Cộng ví"
              value={summary.wallet_credited ?? 0}
            />
            <SummaryCard
              label="Hoàn cashback"
              value={summary.wallet_reversed ?? 0}
            />
            <SummaryCard
              label="Đã xử lý"
              value={summary.already_processed ?? 0}
            />
            <SummaryCard
              label="Errors"
              value={summary.errors ?? 0}
            />
          </section>
        )}

        {syncResult?.synced?.length > 0 && (
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="font-semibold">TikTok orders đã sync</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3">Transaction</th>
                    <th className="px-5 py-3">Tracking</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Cashback</th>
                    <th className="px-5 py-3">Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult.synced.map(
                    (item: any, index: number) => (
                      <tr
                        key={`${item.transaction_id}-${index}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-5 py-3 font-mono text-xs">
                          {item.transaction_id}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">
                          {item.tracking_id}
                        </td>
                        <td className="px-5 py-3">
                          {item.current_status}
                        </td>
                        <td className="px-5 py-3">
                          {Number(
                            item.cashback || 0
                          ).toLocaleString("vi-VN")}{" "}
                          ₫
                        </td>
                        <td className="px-5 py-3 text-xs font-medium">
                          {item.wallet_action}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {syncResult?.skipped?.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
            <div className="border-b border-amber-200 p-5">
              <h2 className="font-semibold text-amber-800">
                Transactions chưa xử lý
              </h2>
              <p className="mt-1 text-sm text-amber-700">
                Đặc biệt chú ý TRACKING_NOT_FOUND.
              </p>
            </div>
            <div className="p-5">
              <pre className="max-h-[500px] overflow-auto rounded-xl bg-white p-4 text-xs">
                {JSON.stringify(syncResult.skipped, null, 2)}
              </pre>
            </div>
          </section>
        )}

        {syncResult && (
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-semibold">Kết quả Sync JSON</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  syncResult.success
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {syncResult.success ? "SUCCESS" : "ERROR"}
              </span>
            </div>
            <div className="p-5">
              <pre className="max-h-[600px] overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-green-300">
                {JSON.stringify(syncResult, null, 2)}
              </pre>
            </div>
          </section>
        )}

        {rawResult && (
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-semibold">
                  ACCESSTRADE raw response
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Dữ liệu nguyên bản ACCESSTRADE trả về.
                </p>
              </div>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    JSON.stringify(rawResult, null, 2)
                  )
                }
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Copy JSON
              </button>
            </div>

            <div className="p-5">
              <pre className="max-h-[600px] overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-green-300">
                {JSON.stringify(rawResult, null, 2)}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
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
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-gray-900">
        {value}
      </div>
    </div>
  );
}
