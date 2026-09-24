"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MobileNav from "@/components/MobileNav";

type OrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

type Platform =
  | "shopee"
  | "lazada"
  | "tiktok"
  | string;

type Order = {
  id: string;
  user_id?: string;
  platform: Platform;
  external_order_id: string | null;
  tracking_id: string | null;
  product_name: string | null;
  order_value: number | null;
  commission: number | null;
  cashback: number | null;
  status: OrderStatus;
  ordered_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
};

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    className: string;
    dotClass: string;
  }
> = {
  pending: {
    label: "Chờ duyệt",
    className:
      "bg-amber-50 text-amber-700 ring-amber-200",
    dotClass: "bg-amber-500",
  },

  approved: {
    label: "Đã duyệt",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dotClass: "bg-emerald-500",
  },

  paid: {
    label: "Đã trả",
    className:
      "bg-blue-50 text-blue-700 ring-blue-200",
    dotClass: "bg-blue-500",
  },

  rejected: {
    label: "Từ chối",
    className:
      "bg-red-50 text-red-700 ring-red-200",
    dotClass: "bg-red-500",
  },
};

function formatMoney(
  value: number | null | undefined
) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function platformLabel(platform: string) {
  switch (platform) {
    case "shopee":
      return "Shopee";

    case "lazada":
      return "Lazada";

    case "tiktok":
      return "TikTok Shop";

    default:
      return platform;
  }
}

function platformIcon(platform: string) {
  switch (platform) {
    case "shopee":
      return "🛍️";

    case "lazada":
      return "🛒";

    case "tiktok":
      return "🎵";

    default:
      return "📦";
  }
}

function getStatusMessage(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "Đơn hàng đang được đối soát.";

    case "approved":
      return "Đơn hàng đã được duyệt và tiền hoàn đã ghi nhận.";

    case "paid":
      return "Tiền hoàn đã được trả vào ví.";

    case "rejected":
      return "Đơn hàng không đủ điều kiện hoàn tiền.";

    default:
      return "";
  }
}

function getStatusMessageClass(
  status: OrderStatus
) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "paid":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "⏳";

    case "approved":
      return "✓";

    case "paid":
      return "✓";

    case "rejected":
      return "×";

    default:
      return "•";
  }
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const orderQueryId =
    searchParams.get("order");

  const [orders, setOrders] = useState<Order[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [filter, setFilter] = useState<
    "all" | OrderStatus
  >("all");

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const [
    selectedFromNotification,
    setSelectedFromNotification,
  ] = useState(false);

  /*
   * Load orders
   *
   * Đây là nguồn dữ liệu chính của trang Orders.
   * Không dùng dữ liệu giả và không lấy từ local state
   * của Dashboard.
   */
  const loadOrders = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      }

      setLoadError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Get user error:",
            userError
          );

          setLoadError(
            "Không thể xác thực tài khoản."
          );

          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("orders")
          .select(
            `
              id,
              user_id,
              platform,
              external_order_id,
              tracking_id,
              product_name,
              order_value,
              commission,
              cashback,
              status,
              ordered_at,
              approved_at,
              paid_at
            `
          )
          .eq("user_id", user.id)
          .order("ordered_at", {
            ascending: false,
            nullsFirst: false,
          });

        if (error) {
          console.error(
            "Load orders error:",
            error
          );

          setLoadError(
            "Không thể tải danh sách đơn hàng."
          );

          return;
        }

        setOrders(
          (data ?? []) as Order[]
        );
      } catch (error) {
        console.error(
          "Unexpected load orders error:",
          error
        );

        setLoadError(
          "Có lỗi xảy ra khi tải đơn hàng."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, supabase]
  );

  /*
   * Initial load
   */
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /*
   * Realtime orders
   *
   * Admin / ACCESSTRADE update orders:
   *
   * pending -> approved
   * approved -> paid
   * pending -> rejected
   *
   * Trang này sẽ tự tải lại dữ liệu mới nhất.
   */
  useEffect(() => {
    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    let cancelled = false;

    async function subscribeOrders() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(
          "Realtime auth error:",
          error
        );
        return;
      }

      if (!user || cancelled) {
        return;
      }

      channel = supabase
        .channel(
          `orders-realtime-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log(
              "Orders realtime event:",
              payload.eventType
            );

            /*
             * Không tự merge payload vào state.
             *
             * Luôn query lại database để lấy đầy đủ
             * commission, cashback, status, approved_at,
             * paid_at... tránh state thiếu dữ liệu.
             */
            loadOrders();
          }
        )
        .subscribe((status) => {
          console.log(
            "Orders realtime status:",
            status
          );

          if (status === "SUBSCRIBED") {
            console.log(
              "✅ Orders realtime connected"
            );
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT"
          ) {
            console.error(
              "❌ Orders realtime connection problem:",
              status
            );

            /*
             * Fallback:
             * realtime lỗi vẫn lấy dữ liệu mới nhất.
             */
            loadOrders();
          }
        });
    }

    subscribeOrders();

    /*
     * Khi người dùng quay lại tab,
     * luôn lấy dữ liệu mới nhất.
     */
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        loadOrders();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    /*
     * Khi cửa sổ browser được focus lại,
     * refresh một lần để tránh dữ liệu cũ.
     */
    const handleFocus = () => {
      loadOrders();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      cancelled = true;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [loadOrders, supabase]);

  /*
   * Handle ?order=UUID
   */
  useEffect(() => {
    if (!orderQueryId) {
      setSelectedOrderId(null);
      setSelectedFromNotification(false);
      return;
    }

    setSelectedOrderId(orderQueryId);
    setSelectedFromNotification(true);

    const timer = window.setTimeout(() => {
      const element =
        document.getElementById(
          `order-${orderQueryId}`
        );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [orderQueryId]);

  /*
   * Selected order
   */
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) {
      return null;
    }

    return (
      orders.find(
        (order) =>
          order.id === selectedOrderId
      ) ?? null
    );
  }, [orders, selectedOrderId]);

  /*
   * Filter
   */
  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    return orders.filter(
      (order) =>
        order.status === filter
    );
  }, [filter, orders]);

  /*
   * Statistics
   */
  const stats = useMemo(() => {
    const approvedOrders = orders.filter(
      (order) =>
        order.status === "approved" ||
        order.status === "paid"
    );

    const pendingOrders = orders.filter(
      (order) =>
        order.status === "pending"
    );

    const rejectedOrders = orders.filter(
      (order) =>
        order.status === "rejected"
    );

    const paidOrders = orders.filter(
      (order) =>
        order.status === "paid"
    );

    const onlyApprovedOrders =
      orders.filter(
        (order) =>
          order.status === "approved"
      );

    const approvedCashback =
      approvedOrders.reduce(
        (sum, order) =>
          sum + Number(order.cashback || 0),
        0
      );

    const pendingCashback =
      pendingOrders.reduce(
        (sum, order) =>
          sum + Number(order.cashback || 0),
        0
      );

    const approvedOrderValue =
      approvedOrders.reduce(
        (sum, order) =>
          sum + Number(
            order.order_value || 0
          ),
        0
      );

    return {
      total: orders.length,
      approved: approvedOrders.length,
      onlyApproved:
        onlyApprovedOrders.length,
      pending: pendingOrders.length,
      rejected: rejectedOrders.length,
      paid: paidOrders.length,
      approvedCashback,
      pendingCashback,
      approvedOrderValue,
    };
  }, [orders]);

  /*
   * Clear ?order=
   */
  function clearSelectedOrder() {
    setSelectedOrderId(null);
    setSelectedFromNotification(false);

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.delete("order");

    const query = params.toString();

    router.replace(
      query
        ? `/orders?${query}`
        : "/orders"
    );
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] pb-28 md:pb-0">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-lg shadow-emerald-500/20">
            📦
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-500">
            Đang tải đơn hàng...
          </p>
        </div>

        <MobileNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-28 text-gray-900 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-xl shadow-sm">
              💰
            </div>

            <div>
              <div className="text-base font-black leading-none tracking-tight">
                Hoàn Tiền Sale
              </div>

              <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Mua sắm · Hoàn tiền
              </div>
            </div>
          </Link>

          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            ← Về trang cá nhân
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gray-900 px-6 py-7 text-white shadow-xl shadow-gray-900/5 md:px-8 md:py-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">
                  THEO DÕI ĐƠN HÀNG
                </div>

                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                  Đơn hàng của bạn
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300 md:text-base">
                  Theo dõi đơn hàng, trạng thái
                  đối soát và số tiền hoàn bạn
                  nhận được.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {refreshing && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-bold text-white">
                    <span className="animate-spin">
                      ↻
                    </span>
                    Đang cập nhật...
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    loadOrders(true)
                  }
                  disabled={refreshing}
                  className="inline-flex items-center rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ↻
                </button>

                <Link
                  href="/"
                  className="inline-flex w-fit items-center rounded-xl bg-white px-5 py-3 text-sm font-black text-gray-900 transition hover:bg-gray-100"
                >
                  Tạo link hoàn tiền
                  <span className="ml-2">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}
        {loadError && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>
              ⚠ {loadError}
            </span>

            <button
              type="button"
              onClick={() =>
                loadOrders(true)
              }
              className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Notification selection */}
        {selectedFromNotification && (
          <div
            className={`mt-5 flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
              selectedOrder
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
                {selectedOrder
                  ? "✓"
                  : "!"}
              </span>

              <span>
                {selectedOrder
                  ? "Đang hiển thị đơn hàng từ thông báo."
                  : "Không tìm thấy đơn hàng này trong tài khoản."}
              </span>
            </div>

            <button
              type="button"
              onClick={clearSelectedOrder}
              className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              Bỏ chọn
            </button>
          </div>
        )}

        {/* Stats */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="📦"
            label="Tổng đơn"
            value={String(stats.total)}
            tone="gray"
          />

          <StatCard
            icon="✓"
            label="Đã duyệt"
            value={String(stats.approved)}
            tone="green"
          />

          <StatCard
            icon="💰"
            label="Tiền hoàn"
            value={formatMoney(
              stats.approvedCashback
            )}
            tone="green"
            compact
          />

          <StatCard
            icon="⏳"
            label="Chờ duyệt"
            value={String(stats.pending)}
            tone="amber"
          />
        </section>

        {/* Filters */}
        <section className="mt-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-gray-900">
                Danh sách đơn hàng
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {filteredOrders.length} đơn đang hiển thị
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto pb-1">
            <div className="inline-flex min-w-max rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
              {(
                [
                  [
                    "all",
                    "Tất cả",
                    stats.total,
                  ],
                  [
                    "pending",
                    "Chờ duyệt",
                    stats.pending,
                  ],
                  [
                    "approved",
                    "Đã duyệt",
                    stats.onlyApproved,
                  ],
                  [
                    "paid",
                    "Đã trả",
                    stats.paid,
                  ],
                  [
                    "rejected",
                    "Từ chối",
                    stats.rejected,
                  ],
                ] as const
              ).map(
                ([
                  value,
                  label,
                  count,
                ]) => {
                  const active =
                    filter === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFilter(value)
                      }
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        active
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {label}

                      <span
                        className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* Orders */}
        <section className="mt-5">
          {filteredOrders.length === 0 ? (
            <div className="rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                📦
              </div>

              <h2 className="mt-5 text-lg font-black">
                {filter === "all"
                  ? "Chưa có đơn hàng"
                  : "Không có đơn phù hợp"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {filter === "all"
                  ? "Khi bạn mua hàng bằng link hoàn tiền và đơn được ghi nhận, đơn hàng sẽ xuất hiện tại đây."
                  : "Thử chọn trạng thái khác để xem các đơn hàng của bạn."}
              </p>

              {filter === "all" && (
                <Link
                  href="/"
                  className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                >
                  Tạo link hoàn tiền
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(
                (order) => {
                  const config =
                    statusConfig[
                      order.status
                    ] ??
                    statusConfig.pending;

                  const isSelected =
                    selectedOrderId ===
                    order.id;

                  const cashback =
                    Number(
                      order.cashback || 0
                    );

                  const commission =
                    Number(
                      order.commission || 0
                    );

                  const orderValue =
                    Number(
                      order.order_value || 0
                    );

                  const isApproved =
                    order.status ===
                      "approved" ||
                    order.status ===
                      "paid";

                  return (
                    <article
                      id={`order-${order.id}`}
                      key={order.id}
                      className={`overflow-hidden rounded-[2rem] border bg-white shadow-sm transition duration-200 ${
                        isSelected
                          ? "border-emerald-400 shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-100"
                          : "border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {/* Main */}
                      <div className="p-5 md:p-6">
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                              {platformIcon(
                                order.platform
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                  {platformLabel(
                                    order.platform
                                  )}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${config.className}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`}
                                  />

                                  {
                                    config.label
                                  }
                                </span>
                              </div>

                              <h2 className="mt-2 line-clamp-2 text-base font-black leading-6 text-gray-900 md:text-lg">
                                {order.product_name ||
                                  "Đơn hàng"}
                              </h2>

                              <p className="mt-1.5 text-xs text-gray-400">
                                {formatDate(
                                  order.ordered_at
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-emerald-50 px-4 py-3 md:min-w-[150px] md:text-right">
                            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600/70">
                              Tiền hoàn
                            </div>

                            <div
                              className={`mt-1 text-xl font-black ${
                                cashback >
                                0
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatMoney(
                                cashback
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Money grid */}
                        <div className="mt-6 grid overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/70 sm:grid-cols-3">
                          <MoneyItem
                            label="Giá trị đơn"
                            value={formatMoney(
                              orderValue
                            )}
                          />

                          <MoneyItem
                            label="Hoa hồng"
                            value={formatMoney(
                              commission
                            )}
                            bordered
                          />

                          <MoneyItem
                            label="Cashback"
                            value={formatMoney(
                              cashback
                            )}
                            valueClass="text-emerald-600"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="border-t border-gray-100 px-5 py-5 md:px-6">
                        <div
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${getStatusMessageClass(
                            order.status
                          )}`}
                        >
                          <span className="mt-0.5 text-base">
                            {getStatusIcon(
                              order.status
                            )}
                          </span>

                          <div>
                            <div className="text-sm font-bold">
                              {getStatusMessage(
                                order.status
                              )}
                            </div>

                            {order.status ===
                              "pending" && (
                              <div className="mt-1 text-xs opacity-75">
                                Thời gian xử lý có thể phụ thuộc vào hệ thống đối tác.
                              </div>
                            )}

                            {order.status ===
                              "approved" && (
                              <div className="mt-1 text-xs opacity-75">
                                Tiền hoàn đã được ghi nhận vào hệ thống.
                              </div>
                            )}

                            {order.status ===
                              "paid" && (
                              <div className="mt-1 text-xs opacity-75">
                                Tiền hoàn đã được ghi nhận là đã trả.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="border-t border-gray-100 px-5 py-6 md:px-6">
                        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                          Tiến trình đơn hàng
                        </div>

                        <div className="mt-5">
                          <div className="hidden md:flex md:items-start">
                            <TimelineItem
                              active
                              completed
                              title="Đơn hàng ghi nhận"
                              date={
                                order.ordered_at
                              }
                            />

                            <TimelineLine
                              active={
                                isApproved
                              }
                            />

                            <TimelineItem
                              active={
                                isApproved
                              }
                              completed={
                                isApproved
                              }
                              title="Đơn hàng được duyệt"
                              date={
                                order.approved_at
                              }
                            />

                            <TimelineLine
                              active={
                                order.status ===
                                "paid"
                              }
                            />

                            <TimelineItem
                              active={
                                order.status ===
                                "paid"
                              }
                              completed={
                                order.status ===
                                "paid"
                              }
                              title="Tiền đã trả"
                              date={
                                order.paid_at
                              }
                            />
                          </div>

                          <div className="md:hidden">
                            <MobileTimeline
                              order={order}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Technical IDs */}
                      <details className="border-t border-gray-100">
                        <summary className="cursor-pointer list-none px-5 py-4 text-xs font-bold text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 md:px-6">
                          <span className="flex items-center justify-between">
                            <span>
                              Thông tin giao dịch
                            </span>

                            <span>
                              Mở rộng ↓
                            </span>
                          </span>
                        </summary>

                        <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-5 md:px-6">
                          <div className="grid gap-5 md:grid-cols-2">
                            <InfoField
                              label="Mã đơn hàng"
                              value={
                                order.external_order_id
                              }
                            />

                            <InfoField
                              label="Tracking ID"
                              value={
                                order.tracking_id
                              }
                            />
                          </div>
                        </div>
                      </details>

                      {/* Selected footer */}
                      {isSelected && (
                        <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-4 md:px-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                                ✓
                              </span>

                              Đơn hàng được mở từ thông báo.
                            </div>

                            <button
                              type="button"
                              onClick={
                                clearSelectedOrder
                              }
                              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                            >
                              Bỏ chọn đơn này
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* Summary */}
        {orders.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
            <div className="grid divide-y divide-gray-100 md:grid-cols-3 md:divide-x md:divide-y-0">
              <SummaryItem
                label="Giá trị đơn đã duyệt"
                value={formatMoney(
                  stats.approvedOrderValue
                )}
              />

              <SummaryItem
                label="Cashback đang chờ"
                value={formatMoney(
                  stats.pendingCashback
                )}
                valueClass="text-amber-600"
              />

              <SummaryItem
                label="Đơn bị từ chối"
                value={String(
                  stats.rejected
                )}
                valueClass="text-red-600"
              />
            </div>
          </section>
        )}

        <footer className="py-10 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Hoàn Tiền Sale
        </footer>
      </div>

      <MobileNav />
    </main>
  );
}

/*
 * Stat card
 */
function StatCard({
  icon,
  label,
  value,
  tone,
  compact = false,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "gray" | "green" | "amber";
  compact?: boolean;
}) {
  const iconClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "amber"
      ? "bg-amber-50 text-amber-600"
      : "bg-gray-100 text-gray-600";

  const valueClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "amber"
      ? "text-amber-600"
      : "text-gray-900";

  return (
    <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">
          {label}
        </span>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${iconClass}`}
        >
          {icon}
        </span>
      </div>

      <div
        className={`mt-4 truncate font-black tracking-tight ${
          compact
            ? "text-lg"
            : "text-2xl"
        } ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

/*
 * Money item
 */
function MoneyItem({
  label,
  value,
  bordered = false,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string;
  bordered?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`p-4 ${
        bordered
          ? "border-y border-gray-100 sm:border-x sm:border-y-0"
          : ""
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div
        className={`mt-1.5 text-sm font-black ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

/*
 * Info field
 */
function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div className="mt-2 break-all rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-xs text-gray-700">
        {value || "—"}
      </div>
    </div>
  );
}

/*
 * Summary item
 */
function SummaryItem({
  label,
  value,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="p-5 md:p-6">
      <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div
        className={`mt-2 text-lg font-black ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

/*
 * Desktop timeline item
 */
function TimelineItem({
  active,
  completed,
  title,
  date,
}: {
  active: boolean;
  completed: boolean;
  title: string;
  date: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
          completed
            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
            : active
            ? "bg-gray-200 text-gray-500"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {completed ? "✓" : "•"}
      </div>

      <div className="min-w-0">
        <div
          className={`text-xs font-bold ${
            completed
              ? "text-gray-900"
              : "text-gray-400"
          }`}
        >
          {title}
        </div>

        <div className="mt-1 text-[11px] text-gray-400">
          {date ? formatDate(date) : "Chưa có"}
        </div>
      </div>
    </div>
  );
}

/*
 * Desktop timeline connector
 */
function TimelineLine({
  active,
}: {
  active: boolean;
}) {
  return (
    <div
      className={`mx-2 mt-4 hidden h-px flex-1 md:block ${
        active
          ? "bg-emerald-300"
          : "bg-gray-200"
      }`}
    />
  );
}

/*
 * Mobile timeline
 */
function MobileTimeline({
  order,
}: {
  order: Order;
}) {
  const isApproved =
    order.status === "approved" ||
    order.status === "paid";

  const items = [
    {
      title: "Đơn hàng ghi nhận",
      date: order.ordered_at,
      completed: true,
    },
    {
      title: "Đơn hàng được duyệt",
      date: order.approved_at,
      completed: isApproved,
    },
    {
      title: "Tiền đã trả",
      date: order.paid_at,
      completed:
        order.status === "paid",
    },
  ];

  return (
    <div className="space-y-0">
      {items.map((item, index) => {
        const last =
          index === items.length - 1;

        return (
          <div
            key={item.title}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                  item.completed
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {item.completed
                  ? "✓"
                  : "•"}
              </div>

              {!last && (
                <div
                  className={`my-1 h-8 w-px ${
                    items[index + 1]
                      ?.completed
                      ? "bg-emerald-300"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            <div className="pb-5">
              <div
                className={`text-sm font-bold ${
                  item.completed
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {item.title}
              </div>

              <div className="mt-1 text-xs text-gray-400">
                {item.date
                  ? formatDate(
                      item.date
                    )
                  : "Chưa có"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageFallback />}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] pb-28 md:pb-0">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-lg shadow-emerald-500/20">
          📦
        </div>

        <p className="mt-4 text-sm font-semibold text-gray-500">
          Đang tải đơn hàng...
        </p>
      </div>
    </main>
  );
}