"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LedgerRow = {
  id: string;
  type: string;
  amount: number;
  order_id: string | null;
  created_at: string;
};

type WithdrawalRow = {
  id: string;
  amount: number;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function maskAccount(value: string | null) {
  if (!value) return "—";

  if (value.length <= 4) {
    return "••••";
  }

  return "•••• •••• " + value.slice(-4);
}

function statusLabel(status: string) {
  switch (status) {
    case "requested":
      return "Đang chờ xử lý";
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
    case "requested":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "approved":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-gray-50 text-gray-600 ring-gray-200";
  }
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [ledgerRes, withdrawalRes] = await Promise.all([
      supabase
        .from("wallet_ledger")
        .select("id, type, amount, order_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("withdrawals")
        .select(
          "id, amount, bank_name, account_name, account_number, status, created_at, processed_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (ledgerRes.error) {
      setError(ledgerRes.error.message);
    }

    if (withdrawalRes.error) {
      setError(withdrawalRes.error.message);
    }

    setLedger((ledgerRes.data as LedgerRow[]) || []);
    setWithdrawals((withdrawalRes.data as WithdrawalRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const walletBalance = useMemo(() => {
    return ledger.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [ledger]);

  const pendingWithdrawal = useMemo(() => {
    return withdrawals
      .filter((row) => row.status === "requested")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [withdrawals]);

  const availableBalance = Math.max(
    0,
    walletBalance - pendingWithdrawal
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const numericAmount = Number(amount.replace(/[^\d]/g, ""));

    if (!numericAmount || numericAmount <= 0) {
      setError("Vui lòng nhập số tiền muốn rút.");
      return;
    }

    if (numericAmount > availableBalance) {
      setError(
        `Số dư có thể rút hiện tại là ${formatMoney(availableBalance)}.`
      );
      return;
    }

    if (!bankName.trim()) {
      setError("Vui lòng nhập tên ngân hàng.");
      return;
    }

    if (!accountName.trim()) {
      setError("Vui lòng nhập tên chủ tài khoản.");
      return;
    }

    if (!accountNumber.trim()) {
      setError("Vui lòng nhập số tài khoản.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: numericAmount,
          bank_name: bankName.trim(),
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể tạo yêu cầu rút tiền.");
      }

      setAmount("");
      setMessage(
        "Yêu cầu rút tiền đã được tạo. Vui lòng chờ admin xử lý."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-32 animate-pulse rounded-3xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.push("/wallet")}
          className="mb-6 text-sm font-semibold text-gray-500 hover:text-gray-900"
        >
          ← Quay lại ví
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">
            Rút tiền
          </h1>

          <p className="mt-2 text-gray-500">
            Nhập thông tin tài khoản ngân hàng để tạo yêu cầu rút tiền.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          {/* LEFT */}
          <div className="space-y-5">
            <div className="rounded-3xl bg-black p-6 text-white shadow-sm">
              <p className="text-sm text-white/60">
                Số dư ví
              </p>

              <p className="mt-2 text-3xl font-black">
                {formatMoney(walletBalance)}
              </p>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    Đang chờ rút
                  </span>

                  <span className="font-bold">
                    {formatMoney(pendingWithdrawal)}
                  </span>
                </div>

                <div className="mt-3 flex justify-between">
                  <span className="text-white/60">
                    Có thể rút
                  </span>

                  <span className="font-black text-emerald-300">
                    {formatMoney(availableBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="font-bold">
                Lưu ý
              </h2>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-500">
                <li>• Kiểm tra chính xác số tài khoản trước khi gửi.</li>
                <li>• Tên chủ tài khoản nên trùng với tài khoản ngân hàng.</li>
                <li>• Yêu cầu sẽ ở trạng thái chờ xử lý sau khi gửi.</li>
                <li>• Không gửi nhiều yêu cầu trùng nhau.</li>
              </ul>
            </div>
          </div>

          {/* FORM */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Thông tin nhận tiền
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Số tiền muốn rút
                </label>

                <input
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value.replace(/[^\d]/g, "")
                    )
                  }
                  placeholder="Ví dụ: 100000"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-black focus:bg-white"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Có thể rút tối đa{" "}
                  <span className="font-semibold text-gray-600">
                    {formatMoney(availableBalance)}
                  </span>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Ngân hàng
                </label>

                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ví dụ: Vietcombank"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tên chủ tài khoản
                </label>

                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="NGUYEN VAN A"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 uppercase outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Số tài khoản
                </label>

                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Nhập số tài khoản"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || availableBalance <= 0}
                className="w-full rounded-2xl bg-black px-5 py-3.5 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {submitting
                  ? "Đang tạo yêu cầu..."
                  : "Gửi yêu cầu rút tiền"}
              </button>
            </form>
          </div>
        </div>

        {/* HISTORY */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              Lịch sử rút tiền
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
            {withdrawals.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl">💸</div>

                <p className="mt-3 font-bold">
                  Chưa có yêu cầu rút tiền
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Các yêu cầu rút tiền của bạn sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {withdrawals.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black">
                          {formatMoney(Number(item.amount))}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        {item.bank_name || "—"} ·{" "}
                        {maskAccount(item.account_number)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    {item.processed_at && (
                      <div className="text-sm text-gray-400">
                        Xử lý: {formatDate(item.processed_at)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}