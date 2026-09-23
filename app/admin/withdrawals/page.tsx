"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  status: "requested" | "processing" | "paid" | "rejected";
  created_at: string;
  processed_at: string | null;
};

type WithdrawalStatus =
  | "processing"
  | "paid"
  | "rejected";

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: Withdrawal["status"]) {
  switch (status) {
    case "requested":
      return "Chờ xử lý";

    case "processing":
      return "Đang xử lý";

    case "paid":
      return "Đã thanh toán";

    case "rejected":
      return "Từ chối";

    default:
      return status;
  }
}

function statusClass(status: Withdrawal["status"]) {
  switch (status) {
    case "requested":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "processing":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "rejected":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-gray-50 text-gray-600 ring-gray-200";
  }
}

function maskAccount(value: string | null) {
  if (!value) return "—";

  if (value.length <= 4) {
    return "••••";
  }

  return `•••• •••• ${value.slice(-4)}`;
}

export default function AdminWithdrawalsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  }

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }

      const response = await fetch(
        "/api/admin/withdrawals",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Không thể tải danh sách yêu cầu rút tiền."
        );
      }

      setWithdrawals(result.withdrawals ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribeWithdrawals() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`admin-withdrawals-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "withdrawals" },
          () => void loadWithdrawals()
        )
        .subscribe();
    }

    void subscribeWithdrawals();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadWithdrawals, supabase]);

  const requested = useMemo(
    () =>
      withdrawals.filter(
        (item) => item.status === "requested"
      ),
    [withdrawals]
  );

  const requestedAmount = useMemo(
    () =>
      requested.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [requested]
  );

  const processing = useMemo(
    () =>
      withdrawals.filter(
        (item) => item.status === "processing"
      ),
    [withdrawals]
  );

  const processingAmount = useMemo(
    () =>
      processing.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [processing]
  );

  const paid = useMemo(
    () =>
      withdrawals.filter(
        (item) => item.status === "paid"
      ),
    [withdrawals]
  );

  const paidAmount = useMemo(
    () =>
      paid.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [paid]
  );

  async function updateStatus(
    id: string,
    status: WithdrawalStatus
  ) {
    setProcessingId(id);
    setError("");
    setSuccess("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }

      const response = await fetch(
        "/api/admin/withdrawals",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Không thể cập nhật yêu cầu rút tiền."
        );
      }

      if (status === "processing") {
        setSuccess(
          "Đã chuyển yêu cầu sang trạng thái đang xử lý."
        );
      } else if (status === "paid") {
        setSuccess(
          "Đã ghi nhận thanh toán và trừ tiền khỏi ví."
        );
      } else {
        setSuccess(
          "Đã từ chối yêu cầu rút tiền."
        );
      }

      await loadWithdrawals();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <div>
            <div className="text-lg font-black">
              Hoàn Tiền Sale
            </div>

            <div className="text-xs text-gray-400">
              Admin · Quản lý rút tiền
            </div>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50"
          >
            Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* Heading */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">
              ADMIN
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Yêu cầu rút tiền
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Kiểm tra thông tin ngân hàng và xử lý yêu cầu
              của người dùng.
            </p>
          </div>

          <button
            onClick={loadWithdrawals}
            disabled={loading}
            className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "↻ Làm mới"}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Stats */}
        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {/* Requested */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Chờ xử lý
              </div>

              <div className="rounded-xl bg-amber-50 px-3 py-2 text-lg">
                ⏳
              </div>
            </div>

            <div className="mt-4 text-3xl font-black text-amber-600">
              {requested.length}
            </div>

            <div className="mt-1 text-xs text-gray-400">
              {formatMoney(requestedAmount)}
            </div>
          </div>

          {/* Processing */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Đang xử lý
              </div>

              <div className="rounded-xl bg-blue-50 px-3 py-2 text-lg">
                🔄
              </div>
            </div>

            <div className="mt-4 text-3xl font-black text-blue-600">
              {processing.length}
            </div>

            <div className="mt-1 text-xs text-gray-400">
              {formatMoney(processingAmount)}
            </div>
          </div>

          {/* Paid */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Đã thanh toán
              </div>

              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-lg">
                ✓
              </div>
            </div>

            <div className="mt-4 text-3xl font-black text-emerald-600">
              {paid.length}
            </div>

            <div className="mt-1 text-xs text-gray-400">
              {formatMoney(paidAmount)}
            </div>
          </div>

          {/* Total */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Tổng yêu cầu
              </div>

              <div className="rounded-xl bg-gray-100 px-3 py-2 text-lg">
                📋
              </div>
            </div>

            <div className="mt-4 text-3xl font-black">
              {withdrawals.length}
            </div>

            <div className="mt-1 text-xs text-gray-400">
              Tất cả trạng thái
            </div>
          </div>
        </section>

        {/* List */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-black">
              Danh sách yêu cầu
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Xử lý từng yêu cầu theo đúng quy trình thanh toán.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl">💸</div>

              <p className="mt-3 font-bold">
                Chưa có yêu cầu rút tiền
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Khi user gửi yêu cầu, dữ liệu sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((item) => {
                const isProcessing =
                  processingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-6 transition hover:bg-gray-50/50"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      {/* Information */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-2xl font-black">
                            {formatMoney(
                              Number(item.amount)
                            )}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(
                              item.status
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                          <div>
                            <div className="text-xs text-gray-400">
                              User ID
                            </div>

                            <div className="mt-1 break-all font-mono text-xs">
                              {item.user_id}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-400">
                              Thời gian tạo
                            </div>

                            <div className="mt-1">
                              {formatDate(item.created_at)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-400">
                              Ngân hàng
                            </div>

                            <div className="mt-1 font-bold">
                              {item.bank_name || "—"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-400">
                              Chủ tài khoản
                            </div>

                            <div className="mt-1 font-bold">
                              {item.account_name || "—"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-400">
                              Số tài khoản
                            </div>

                            <div className="mt-1 font-mono font-bold">
                              {maskAccount(
                                item.account_number
                              )}
                            </div>
                          </div>

                          {item.processed_at && (
                            <div>
                              <div className="text-xs text-gray-400">
                                Thời gian xử lý
                              </div>

                              <div className="mt-1">
                                {formatDate(
                                  item.processed_at
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap gap-3">
                        {item.status === "requested" && (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm("Bạn chắc chắn muốn từ chối yêu cầu rút tiền này?")) {
                                  void updateStatus(item.id, "rejected");
                                }
                              }}
                              disabled={isProcessing}
                              className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Từ chối
                            </button>

                            <button
                              onClick={() => void updateStatus(item.id, "processing")}
                              disabled={isProcessing}
                              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Đang xử lý..."
                                : "Bắt đầu xử lý"}
                            </button>
                          </>
                        )}

                        {item.status === "processing" && (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm("Bạn chắc chắn muốn từ chối yêu cầu rút tiền này?")) {
                                  void updateStatus(item.id, "rejected");
                                }
                              }}
                              disabled={isProcessing}
                              className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Từ chối
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm("Xác nhận bạn đã chuyển tiền cho người dùng? Sau bước này hệ thống sẽ ghi nhận paid và trừ tiền khỏi ví.")) {
                                  void updateStatus(item.id, "paid");
                                }
                              }}
                              disabled={isProcessing}
                              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Đang ghi nhận..."
                                : "Đã thanh toán"}
                            </button>
                          </>
                        )}

                        {item.status === "paid" && (
                          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                            ✓ Đã thanh toán
                          </div>
                        )}

                        {item.status === "rejected" && (
                          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            Đã từ chối
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}