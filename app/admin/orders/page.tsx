"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LedgerItem = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  created_at: string;
};

type Order = {
  id: string;
  user_id: string;
  platform: string;
  external_order_id: string | null;
  tracking_id: string | null;
  product_name: string | null;
  order_value: number | null;
  commission: number | null;
  cashback: number | null;
  status: string;
  ordered_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  imported_at: string | null;
  profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null;
  ledger: LedgerItem[];
  wallet: {
    cashback_credited: number;
    cashback_reversed: number;
    net: number;
  };
};

type OrdersResponse = {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};

function money(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function number(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

function date(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function platformLabel(platform: string) {
  switch (platform?.toLowerCase()) {
    case "shopee":
      return "Shopee";
    case "lazada":
      return "Lazada";
    case "tiktok":
      return "TikTok Shop";
    default:
      return platform || "-";
  }
}

function platformClass(platform: string) {
  switch (platform?.toLowerCase()) {
    case "shopee":
      return "bg-orange-100 text-orange-700";
    case "lazada":
      return "bg-blue-100 text-blue-700";
    case "tiktok":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Chờ duyệt";
    case "approved":
      return "Đã duyệt";
    case "paid":
      return "Đã thanh toán";
    case "rejected":
      return "Từ chối";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "approved":
    case "paid":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function ledgerLabel(type: string) {
  switch (type) {
    case "cashback":
      return "Cộng cashback";
    case "cashback_reversal":
      return "Hoàn cashback";
    case "withdrawal":
      return "Rút tiền";
    case "adjustment":
      return "Điều chỉnh";
    default:
      return type;
  }
}

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<OrdersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        status,
        platform,
      });

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(
        `/api/admin/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const responseText = await response.text();

      let json: OrdersResponse;

      try {
        json = JSON.parse(responseText);
      } catch {
        console.error(
          "ADMIN ORDERS NON-JSON:",
          response.status,
          responseText
        );
        throw new Error(
          `API trả về HTTP ${response.status} nhưng không phải JSON.`
        );
      }

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Không thể tải đơn hàng.");
      }

      setData(json);

      if (selectedOrder) {
        const refreshed = json.orders.find(
          (item) => item.id === selectedOrder.id
        );
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  }, [page, platform, search, selectedOrder, status, supabase]);

  useEffect(() => {
    loadOrders();
    // selectedOrder intentionally omitted to avoid refetch loop when drawer refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, platform, search, status]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setPlatform("all");
    setPage(1);
  }

  const totalCashbackOnPage =
    data?.orders.reduce(
      (sum, order) => sum + Number(order.cashback ?? 0),
      0
    ) ?? 0;

  const netWalletOnPage =
    data?.orders.reduce(
      (sum, order) => sum + Number(order.wallet?.net ?? 0),
      0
    ) ?? 0;

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-sm font-semibold text-emerald-600">
              HOÀN TIỀN SĂN SALE
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Admin Orders Center
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý tập trung đơn Shopee, Lazada và TikTok Shop.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              ← Admin
            </Link>
            <Link
              href="/admin/import/shopee"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Import Shopee
            </Link>
            <Link
              href="/admin/import/lazada"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Import Lazada
            </Link>
            <Link
              href="/admin/accesstrade"
              className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              TikTok / ACCESSTRADE
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-bold">Không tải được đơn hàng</div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Đơn theo bộ lọc"
            value={
              loading
                ? "..."
                : number(data?.pagination.total ?? 0)
            }
          />
          <SummaryCard
            label="Đang hiển thị"
            value={number(data?.orders.length ?? 0)}
          />
          <SummaryCard
            label="Cashback trang này"
            value={money(totalCashbackOnPage)}
          />
          <SummaryCard
            label="Ví ròng trang này"
            value={money(netWalletOnPage)}
          />
        </section>

        <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={submitSearch}
            className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]"
          >
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm mã đơn, tracking hoặc sản phẩm..."
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
            />

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="paid">Đã thanh toán</option>
              <option value="rejected">Từ chối</option>
            </select>

            <select
              value={platform}
              onChange={(event) => {
                setPlatform(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả sàn</option>
              <option value="shopee">Shopee</option>
              <option value="lazada">Lazada</option>
              <option value="tiktok">TikTok Shop</option>
            </select>

            <button
              type="submit"
              className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Tìm
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold hover:bg-gray-50"
            >
              Xóa lọc
            </button>
          </form>
        </section>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            {loading
              ? "Đang tải..."
              : `Tìm thấy ${number(
                  data?.pagination.total ?? 0
                )} đơn hàng`}
          </div>

          <button
            type="button"
            onClick={() => loadOrders()}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="w-[29%] px-4 py-4">Đơn hàng</th>
                  <th className="w-[14%] px-4 py-4">User</th>
                  <th className="w-[10%] px-4 py-4">Sàn</th>
                  <th className="w-[20%] px-4 py-4">Tài chính</th>
                  <th className="w-[11%] px-4 py-4">Trạng thái</th>
                  <th className="w-[10%] px-4 py-4">Thời gian</th>
                  <th className="w-[6%] px-4 py-4 text-right">Xem</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-gray-400"
                    >
                      Đang tải đơn hàng...
                    </td>
                  </tr>
                ) : !data || data.orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <div className="font-semibold text-gray-500">
                        Không tìm thấy đơn hàng
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="max-w-[330px] px-5 py-4">
                        <div className="font-semibold">
                          {order.product_name ||
                            "Không có tên sản phẩm"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Mã: {order.external_order_id || order.id}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-gray-400">
                          Tracking: {order.tracking_id || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[180px] truncate text-xs font-semibold">
                          {order.profile?.full_name ||
                            "Chưa có tên"}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-gray-400">
                          {order.user_id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${platformClass(
                            order.platform
                          )}`}
                        >
                          {platformLabel(order.platform)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400">Đơn</span>
                            <span className="font-bold">{money(order.order_value)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400">HH</span>
                            <span>{money(order.commission)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400">Cashback</span>
                            <span className="font-bold text-emerald-600">{money(order.cashback)}</span>
                          </div>
                          <div className="flex justify-between gap-2 border-t pt-1">
                            <span className="text-gray-400">Ví</span>
                            <span
                              className={`font-black ${
                                Number(order.wallet?.net ?? 0) < 0
                                  ? "text-red-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {money(order.wallet?.net ?? 0)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            order.status
                          )}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {date(order.ordered_at)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold hover:bg-gray-50"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-400">
                Hiển thị {data.orders.length} /{" "}
                {number(data.pagination.total)} đơn
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trước
                </button>

                <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold">
                  {page} / {data.pagination.totalPages}
                </div>

                <button
                  disabled={
                    page >= data.pagination.totalPages || loading
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        data.pagination.totalPages,
                        current + 1
                      )
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-xl font-black text-gray-900">
        {value}
      </div>
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b bg-white px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase text-emerald-600">
              {platformLabel(order.platform)}
            </div>
            <h2 className="mt-1 text-xl font-black">
              Chi tiết đơn hàng
            </h2>
            <div className="mt-1 break-all font-mono text-xs text-gray-500">
              {order.external_order_id || order.id}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-3 py-2 text-sm font-bold hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-6 p-6">
          {(order.status === "approved" || order.status === "paid") &&
            Number(order.cashback ?? 0) > 0 &&
            !order.ledger.some((item) => item.type === "cashback") && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="font-black">Cảnh báo cashback</div>
                <div className="mt-1">
                  Đơn đang ở trạng thái {statusLabel(order.status)} và có cashback dự kiến{" "}
                  <strong>{money(order.cashback)}</strong>, nhưng chưa có ledger{" "}
                  <code>cashback</code>. Cần kiểm tra lại quá trình đồng bộ trước khi xử lý thủ công.
                </div>
              </div>
            )}

          {order.status === "rejected" &&
            order.ledger.some((item) => item.type === "cashback") &&
            !order.ledger.some((item) => item.type === "cashback_reversal") && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="font-black">Cảnh báo reversal</div>
                <div className="mt-1">
                  Đơn đã bị từ chối và từng được cộng cashback nhưng chưa có ledger{" "}
                  <code>cashback_reversal</code>. Cần kiểm tra lại đồng bộ.
                </div>
              </div>
            )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailCard label="Giá trị đơn" value={money(order.order_value)} />
            <DetailCard label="Hoa hồng" value={money(order.commission)} />
            <DetailCard label="Cashback" value={money(order.cashback)} />
            <DetailCard label="Ví ròng" value={money(order.wallet?.net ?? 0)} />
          </div>

          <div className="grid gap-x-8 gap-y-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-2">
            <DetailRow label="Sản phẩm" value={order.product_name || "-"} />
            <DetailRow
              label="Trạng thái"
              value={statusLabel(order.status)}
            />
            <DetailRow
              label="Tracking ID"
              value={order.tracking_id || "-"}
              mono
            />
            <DetailRow
              label="User"
              value={order.profile?.full_name || order.user_id}
            />
            <DetailRow label="Ngày đặt" value={date(order.ordered_at)} />
            <DetailRow label="Ngày duyệt" value={date(order.approved_at)} />
            <DetailRow label="Ngày thanh toán" value={date(order.paid_at)} />
            <DetailRow label="Ngày import" value={date(order.imported_at)} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black">Wallet ledger</h3>
              <div className="text-xs text-gray-500">
                {order.ledger.length} giao dịch
              </div>
            </div>

            {order.ledger.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-gray-400">
                Đơn này chưa phát sinh wallet ledger.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Loại</th>
                      <th className="px-4 py-3">Số tiền</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.ledger.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold">
                          {ledgerLabel(item.type)}
                        </td>
                        <td
                          className={`px-4 py-3 font-black ${
                            Number(item.amount) < 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {money(item.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                          {date(item.created_at)}
                        </td>
                        <td className="max-w-[240px] px-4 py-3 text-gray-500">
                          {item.note || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400">{label}</div>
      <div
        className={`mt-1 break-all text-sm font-semibold text-gray-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
