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
  bank_transaction_code: string | null;
  payment_note: string | null;
};

type WithdrawalStatus = "processing" | "paid" | "rejected";

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
  if (status === "requested") return "Chờ xử lý";
  if (status === "processing") return "Đang xử lý";
  if (status === "paid") return "Đã thanh toán";
  return "Từ chối";
}

function statusClass(status: Withdrawal["status"]) {
  if (status === "requested") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "processing") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (status === "paid") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

function maskAccount(value: string | null) {
  if (!value) return "—";
  if (value.length <= 4) return "••••";
  return `•••• •••• ${value.slice(-4)}`;
}

export default function AdminWithdrawalsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [paymentItem, setPaymentItem] = useState<Withdrawal | null>(null);
  const [transactionCode, setTransactionCode] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

      const response = await fetch("/api/admin/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể tải danh sách yêu cầu rút tiền.");
      }

      setWithdrawals(result.withdrawals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribe() {
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

    void subscribe();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadWithdrawals, supabase]);

  const requested = useMemo(
    () => withdrawals.filter((x) => x.status === "requested"),
    [withdrawals]
  );
  const processing = useMemo(
    () => withdrawals.filter((x) => x.status === "processing"),
    [withdrawals]
  );
  const paid = useMemo(
    () => withdrawals.filter((x) => x.status === "paid"),
    [withdrawals]
  );

  function total(items: Withdrawal[]) {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  async function updateStatus(
    id: string,
    status: WithdrawalStatus,
    extra?: { transaction_code?: string; payment_note?: string }
  ) {
    setProcessingId(id);
    setError("");
    setSuccess("");

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

      const response = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status, ...extra }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể cập nhật yêu cầu rút tiền.");
      }

      if (status === "processing") {
        setSuccess("Đã chuyển yêu cầu sang trạng thái đang xử lý.");
      } else if (status === "paid") {
        setSuccess("Đã xác nhận thanh toán và trừ tiền khỏi ví.");
        setPaymentItem(null);
        setTransactionCode("");
        setPaymentNote("");
      } else {
        setSuccess("Đã từ chối yêu cầu rút tiền.");
      }

      await loadWithdrawals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setProcessingId(null);
    }
  }

  async function confirmPayment() {
    if (!paymentItem) return;
    const code = transactionCode.trim();

    if (!code) {
      setError("Vui lòng nhập mã giao dịch ngân hàng.");
      return;
    }

    await updateStatus(paymentItem.id, "paid", {
      transaction_code: code,
      payment_note: paymentNote.trim(),
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <div>
            <div className="text-lg font-black">Hoàn Tiền Sale</div>
            <div className="text-xs text-gray-400">Admin · Quản lý rút tiền</div>
          </div>
          <Link href="/admin" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-50">
            Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">ADMIN</div>
            <h1 className="mt-2 text-3xl font-black">Yêu cầu rút tiền</h1>
            <p className="mt-2 text-sm text-gray-500">
              Chỉ xác nhận đã thanh toán sau khi tiền thật đã được chuyển thành công.
            </p>
          </div>
          <button onClick={loadWithdrawals} disabled={loading} className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {loading ? "Đang tải..." : "↻ Làm mới"}
          </button>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
        {success && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{success}</div>}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat title="Chờ xử lý" count={requested.length} amount={total(requested)} className="text-amber-600" />
          <Stat title="Đang xử lý" count={processing.length} amount={total(processing)} className="text-blue-600" />
          <Stat title="Đã thanh toán" count={paid.length} amount={total(paid)} className="text-emerald-600" />
          <Stat title="Tổng yêu cầu" count={withdrawals.length} />
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-black">Danh sách yêu cầu</h2>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : withdrawals.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">Chưa có yêu cầu rút tiền.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((item) => {
                const busy = processingId === item.id;

                return (
                  <div key={item.id} className="p-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-2xl font-black">{formatMoney(Number(item.amount))}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                          <Info title="Ngân hàng" value={item.bank_name || "—"} />
                          <Info title="Chủ tài khoản" value={item.account_name || "—"} />
                          <Info title="Số tài khoản" value={maskAccount(item.account_number)} />
                          <Info title="Thời gian tạo" value={formatDate(item.created_at)} />
                          <Info title="User ID" value={item.user_id} mono />
                          {item.processed_at && <Info title="Thời gian xử lý" value={formatDate(item.processed_at)} />}
                          {item.bank_transaction_code && <Info title="Mã giao dịch" value={item.bank_transaction_code} mono />}
                          {item.payment_note && <Info title="Ghi chú" value={item.payment_note} />}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-3">
                        {item.status === "requested" && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm("Bạn chắc chắn muốn từ chối yêu cầu này?")) {
                                  void updateStatus(item.id, "rejected");
                                }
                              }}
                              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => void updateStatus(item.id, "processing")}
                              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                            >
                              {busy ? "Đang xử lý..." : "Bắt đầu xử lý"}
                            </button>
                          </>
                        )}

                        {item.status === "processing" && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm("Bạn chắc chắn muốn từ chối yêu cầu này?")) {
                                  void updateStatus(item.id, "rejected");
                                }
                              }}
                              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => {
                                setError("");
                                setPaymentItem(item);
                                setTransactionCode("");
                                setPaymentNote("");
                              }}
                              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                            >
                              Xác nhận thanh toán
                            </button>
                          </>
                        )}

                        {item.status === "paid" && (
                          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">✓ Đã thanh toán</div>
                        )}

                        {item.status === "rejected" && (
                          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Đã từ chối</div>
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

      {paymentItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">THANH TOÁN</div>
            <h2 className="mt-2 text-2xl font-black">Xác nhận đã chuyển tiền</h2>
            <p className="mt-2 text-sm text-gray-500">
              Chuyển khoản thật trước, sau đó nhập mã giao dịch ngân hàng.
            </p>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm">
              <Row label="Số tiền" value={formatMoney(Number(paymentItem.amount))} />
              <Row label="Ngân hàng" value={paymentItem.bank_name || "—"} />
              <Row label="Chủ tài khoản" value={paymentItem.account_name || "—"} />
              <Row label="Số tài khoản" value={paymentItem.account_number || "—"} mono />
            </div>

            <label className="mt-5 block text-sm font-bold">
              Mã giao dịch ngân hàng <span className="text-red-500">*</span>
            </label>
            <input
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value)}
              placeholder="VD: FT260925123456"
              autoFocus
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <label className="mt-4 block text-sm font-bold">Ghi chú</label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="VD: Đã chuyển khoản qua MB Bank"
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={processingId === paymentItem.id}
                onClick={() => setPaymentItem(null)}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold"
              >
                Hủy
              </button>
              <button
                disabled={processingId === paymentItem.id || !transactionCode.trim()}
                onClick={() => void confirmPayment()}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId === paymentItem.id ? "Đang xác nhận..." : "Xác nhận đã thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({
  title,
  count,
  amount,
  className = "text-gray-900",
}: {
  title: string;
  count: number;
  amount?: number;
  className?: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`mt-4 text-3xl font-black ${className}`}>{count}</div>
      <div className="mt-1 text-xs text-gray-400">
        {typeof amount === "number" ? formatMoney(amount) : "Tất cả trạng thái"}
      </div>
    </div>
  );
}

function Info({ title, value, mono = false }: { title: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-400">{title}</div>
      <div className={`mt-1 break-all font-bold ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mt-2 flex justify-between gap-4 first:mt-0">
      <span>{label}</span>
      <b className={mono ? "font-mono" : ""}>{value}</b>
    </div>
  );
}
