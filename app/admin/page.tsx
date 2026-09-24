"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PlatformStats = {
  orders: number;
  approved: number;
  pending: number;
  rejected: number;
  orderValue: number;
  commission: number;
  cashback: number;
};

type DashboardStats = {
  users: number;
  affiliateLinks: number;
  totalClicks: number;
  orders: number;
  approvedOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
  totalOrderValue: number;
  totalCommission: number;
  totalCashback: number;
  walletBalance: number;
  ledgerCashback: number;
  cashbackReversed: number;
  netCashbackLedger: number;
  totalWithdrawn: number;
  withdrawals: number;
  requestedWithdrawals: number;
  processingWithdrawals: number;
  paidWithdrawals: number;
  rejectedWithdrawals: number;
  requestedAmount: number;
  processingAmount: number;
  paidAmount: number;
  reservedWithdrawal: number;
  availableBalance: number;
  approvedMissingCashback: number;
  rejectedMissingReversal: number;
  ledgerMismatchOrders: number;
};

type Order = {
  id: string;
  platform: string;
  external_order_id: string | null;
  tracking_id: string | null;
  product_name: string | null;
  order_value: number | null;
  commission: number | null;
  cashback: number | null;
  status: string;
  ordered_at: string | null;
};

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  status: string;
  created_at: string;
};

type AlertOrder = {
  id: string;
  external_order_id: string | null;
  platform: string;
  cashback: number;
  ledger_cashback?: number;
};

type DashboardResponse = {
  success: boolean;
  stats: DashboardStats;
  platforms: {
    shopee: PlatformStats;
    lazada: PlatformStats;
    tiktok: PlatformStats;
  };
  alerts: {
    approvedMissingCashback: AlertOrder[];
    rejectedMissingReversal: AlertOrder[];
    ledgerMismatchOrders: AlertOrder[];
  };
  recentOrders: Order[];
  recentWithdrawals: Withdrawal[];
  error?: string;
};

function money(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function num(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

function date(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function platformLabel(value: string) {
  if (value === "shopee") return "Shopee";
  if (value === "lazada") return "Lazada";
  if (value === "tiktok") return "TikTok Shop";
  return value || "-";
}

function statusLabel(value: string) {
  if (value === "pending") return "Chờ duyệt";
  if (value === "approved") return "Đã duyệt";
  if (value === "paid") return "Đã thanh toán";
  if (value === "rejected") return "Từ chối";
  if (value === "requested") return "Yêu cầu";
  if (value === "processing") return "Đang xử lý";
  return value;
}

function statusClass(value: string) {
  if (["approved", "paid"].includes(value))
    return "bg-emerald-100 text-emerald-700";
  if (["pending", "requested", "processing"].includes(value))
    return "bg-amber-100 text-amber-700";
  if (value === "rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = (await response.json()) as DashboardResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Không thể tải dashboard.");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = data?.stats;
  const alertCount =
    (s?.approvedMissingCashback ?? 0) +
    (s?.rejectedMissingReversal ?? 0) +
    (s?.ledgerMismatchOrders ?? 0);

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-sm font-bold text-emerald-600">
              HOÀN TIỀN SĂN SALE
            </div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Tổng quan vận hành Shopee, Lazada và TikTok Shop.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {loading ? "Đang tải..." : "↻ Làm mới"}
            </button>
            <Link href="/" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">
              Trang chính
            </Link>
            <Link href="/admin/orders" className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white">
              Đơn hàng
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Người dùng" value={loading ? "..." : num(s?.users)} sub={`${num(s?.affiliateLinks)} affiliate links`} />
          <Stat label="Đơn hàng" value={num(s?.orders)} sub={`${num(s?.approvedOrders)} duyệt · ${num(s?.pendingOrders)} chờ`} />
          <Stat label="GMV đã duyệt" value={money(s?.totalOrderValue)} sub={`Hoa hồng ${money(s?.totalCommission)}`} />
          <Stat label="Số dư ví" value={money(s?.walletBalance)} sub={`Khả dụng ${money(s?.availableBalance)}`} />
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Cashback theo đơn" value={money(s?.totalCashback)} sub="Approved + paid" />
          <Stat label="Cashback đã cộng" value={money(s?.ledgerCashback)} sub="wallet_ledger: cashback" />
          <Stat label="Đã reversal" value={money(s?.cashbackReversed)} sub={`Net cashback ${money(s?.netCashbackLedger)}`} />
          <Stat label="Đang giữ để rút" value={money(s?.reservedWithdrawal)} sub={`${num(s?.requestedWithdrawals)} yêu cầu · ${num(s?.processingWithdrawals)} xử lý`} />
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-black">Theo sàn</h2>
              <p className="text-sm text-gray-500">Chỉ GMV/commission/cashback của đơn approved hoặc paid.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {data && (
              <>
                <PlatformCard title="Shopee" data={data.platforms.shopee} href="/admin/import/shopee" />
                <PlatformCard title="Lazada" data={data.platforms.lazada} href="/admin/import/lazada" />
                <PlatformCard title="TikTok Shop" data={data.platforms.tiktok} href="/admin/accesstrade" />
              </>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Đối soát cashback</h2>
              <p className="mt-1 text-sm text-gray-500">
                Phát hiện order và wallet ledger chưa đồng bộ.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${alertCount ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {alertCount ? `${alertCount} cảnh báo` : "Không có cảnh báo"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <AlertCard
              title="Duyệt nhưng chưa cộng ví"
              count={s?.approvedMissingCashback ?? 0}
              description="Approved/paid có cashback nhưng chưa có ledger cashback."
            />
            <AlertCard
              title="Từ chối chưa reversal"
              count={s?.rejectedMissingReversal ?? 0}
              description="Đã từng cộng cashback nhưng order rejected chưa có reversal."
            />
            <AlertCard
              title="Cashback không khớp"
              count={s?.ledgerMismatchOrders ?? 0}
              description="Số cashback trên order khác số đã credit vào ledger."
            />
          </div>

          {data && alertCount > 0 && (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              Không tự chỉnh tiền tại Dashboard. Mở{" "}
              <Link href="/admin/orders" className="font-black underline">
                Admin Orders Center
              </Link>{" "}
              để kiểm tra order và ledger trước khi xử lý.
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          <Stat label="Yêu cầu rút" value={num(s?.requestedWithdrawals)} sub={money(s?.requestedAmount)} />
          <Stat label="Đang xử lý" value={num(s?.processingWithdrawals)} sub={money(s?.processingAmount)} />
          <Stat label="Đã thanh toán" value={num(s?.paidWithdrawals)} sub={money(s?.paidAmount)} />
          <Stat label="Tổng đã trừ ví" value={money(s?.totalWithdrawn)} sub={`${num(s?.rejectedWithdrawals)} yêu cầu bị từ chối`} />
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
          <SectionHeader title="Đơn hàng gần đây" href="/admin/orders" link="Xem tất cả →" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Đơn</th>
                  <th className="px-6 py-3">Sàn</th>
                  <th className="px-6 py-3">Giá trị</th>
                  <th className="px-6 py-3">Cashback</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!data?.recentOrders.length ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Chưa có đơn hàng.</td></tr>
                ) : data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold">{order.product_name || order.external_order_id || "-"}</div>
                      <div className="mt-1 text-xs text-gray-400">{order.external_order_id || "-"}</div>
                    </td>
                    <td className="px-6 py-4">{platformLabel(order.platform)}</td>
                    <td className="px-6 py-4 font-bold">{money(order.order_value)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{money(order.cashback)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{date(order.ordered_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
          <SectionHeader title="Yêu cầu rút tiền gần đây" href="/admin/withdrawals" link="Quản lý rút tiền →" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Ngân hàng</th>
                  <th className="px-6 py-3">Số tiền</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!data?.recentWithdrawals.length ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Chưa có yêu cầu rút tiền.</td></tr>
                ) : data.recentWithdrawals.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-mono text-xs">{item.user_id.slice(0, 12)}...</td>
                    <td className="px-6 py-4">{item.bank_name || "-"}</td>
                    <td className="px-6 py-4 font-black">{money(item.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{date(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-black">Quản trị nhanh</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Quick href="/admin/users" title="Người dùng" desc="User, đơn, ví và thông tin nhận tiền." />
            <Quick
  href="/admin/products" title="Sản phẩm" desc="Thêm, sửa và quản lý sản phẩm hiển thị trên trang chủ." />
            <Quick href="/admin/orders" title="Đơn hàng" desc="Kiểm tra order và wallet ledger." />
            <Quick href="/admin/withdrawals" title="Rút tiền" desc="Xử lý yêu cầu rút tiền." />
            <Quick href="/admin/import/shopee" title="Import Shopee" desc="Nhập báo cáo Shopee Affiliate." />
            <Quick href="/admin/import/lazada" title="Import Lazada" desc="Nhập Lazada Conversion Report." />
            <Quick href="/admin/accesstrade" title="TikTok / ACCESSTRADE" desc="Đồng bộ transaction TikTok Shop." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{sub}</div>
    </div>
  );
}

function PlatformCard({ title, data, href }: { title: string; data: PlatformStats; href: string }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">{title}</h3>
        <Link href={href} className="text-xs font-bold text-emerald-600">Quản lý →</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Mini label="Tổng đơn" value={num(data.orders)} />
        <Mini label="Đã duyệt" value={num(data.approved)} />
        <Mini label="GMV" value={money(data.orderValue)} />
        <Mini label="Hoa hồng" value={money(data.commission)} />
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Pending {num(data.pending)} · Rejected {num(data.rejected)} · Cashback {money(data.cashback)}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  );
}

function AlertCard({ title, count, description }: { title: string; count: number; description: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${count ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-black">{title}</div>
        <div className={`rounded-full px-2.5 py-1 text-xs font-black ${count ? "bg-amber-200 text-amber-900" : "bg-white text-gray-500"}`}>
          {num(count)}
        </div>
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{description}</div>
    </div>
  );
}

function SectionHeader({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="flex items-center justify-between border-b p-6">
      <h2 className="text-lg font-black">{title}</h2>
      <Link href={href} className="text-sm font-bold text-gray-600 hover:text-black">{link}</Link>
    </div>
  );
}

function Quick({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="font-black">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{desc}</div>
    </Link>
  );
}
