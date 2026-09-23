"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MobileNav from "@/components/MobileNav";

type Ledger = {
  id: string;
  type: string;
  amount: number;
  order_id: string | null;
  created_at: string;
};

type Withdrawal = {
  id: string;
  amount: number;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
};

type ProfileBank = {
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTypeLabel(type: string) {
  switch (type) {
    case "cashback":
      return "Hoàn tiền đơn hàng";

    case "cashback_reversal":
      return "Hoàn tác tiền hoàn";

    case "referral":
    case "referral_commission":
      return "Hoa hồng giới thiệu";

    case "referral_reversal":
      return "Hoàn tác hoa hồng giới thiệu";

    case "withdraw":
    case "withdrawal":
      return "Rút tiền";

    case "adjustment":
      return "Điều chỉnh";

    default:
      return type || "Giao dịch";
  }
}

function getLedgerIcon(type: string, amount: number) {
  if (type === "cashback") return "↗";

  if (
    type === "referral" ||
    type === "referral_commission"
  ) {
    return "★";
  }

  if (
    type === "cashback_reversal" ||
    type === "referral_reversal"
  ) {
    return "↩";
  }

  if (
    type === "withdraw" ||
    type === "withdrawal"
  ) {
    return "↙";
  }

  if (amount > 0) return "+";
  if (amount < 0) return "−";

  return "•";
}

function getLedgerIconClass(type: string, amount: number) {
  if (
    type === "cashback" ||
    type === "referral" ||
    type === "referral_commission"
  ) {
    return "bg-emerald-50 text-emerald-600";
  }

  if (
    type === "cashback_reversal" ||
    type === "referral_reversal"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    type === "withdraw" ||
    type === "withdrawal"
  ) {
    return "bg-blue-50 text-blue-600";
  }

  if (amount < 0) {
    return "bg-gray-100 text-gray-600";
  }

  return "bg-gray-100 text-gray-500";
}

function withdrawalStatusLabel(status: string) {
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
      return status || "Không xác định";
  }
}

function withdrawalStatusClass(status: string) {
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
  if (!value) {
    return "—";
  }

  const cleanValue = value.trim();

  if (!cleanValue) {
    return "—";
  }

  if (cleanValue.length <= 4) {
    return "••••";
  }

  return `•••• •••• ${cleanValue.slice(-4)}`;
}

export default function WalletPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [profileBank, setProfileBank] = useState<ProfileBank | null>(null);

  const [loading, setLoading] = useState(true);

  const [walletLoadError, setWalletLoadError] = useState("");
  const [withdrawalLoadError, setWithdrawalLoadError] =
    useState("");

  const [submitting, setSubmitting] = useState(false);

  const [showWithdrawForm, setShowWithdrawForm] =
    useState(false);

  const [amount, setAmount] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load wallet + withdrawal history
   */
  const loadWallet = useCallback(async () => {
    setWalletLoadError("");
    setWithdrawalLoadError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Wallet auth error:", authError);

        setWalletLoadError(
          "Không thể xác thực tài khoản. Vui lòng đăng nhập lại."
        );

        setLoading(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const ledgerQuery = supabase
        .from("wallet_ledger")
        .select(
          "id, type, amount, order_id, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      const withdrawalQuery = supabase
        .from("withdrawals")
        .select(
          `
            id,
            amount,
            bank_name,
            account_name,
            account_number,
            status,
            created_at,
            processed_at
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      const profileQuery = supabase
        .from("profiles")
        .select(
          "bank_name,bank_account_name,bank_account_number"
        )
        .eq("id", user.id)
        .maybeSingle();

      const [
        ledgerResult,
        withdrawalResult,
        profileResult,
      ] = await Promise.all([
        ledgerQuery,
        withdrawalQuery,
        profileQuery,
      ]);

      /*
       * WALLET LEDGER
       */
      if (ledgerResult.error) {
        console.error(
          "========== WALLET QUERY ERROR =========="
        );

        console.error(
          "message:",
          ledgerResult.error.message
        );

        console.error(
          "code:",
          ledgerResult.error.code
        );

        console.error(
          "details:",
          ledgerResult.error.details
        );

        console.error(
          "hint:",
          ledgerResult.error.hint
        );

        console.error(
          "full:",
          JSON.stringify(
            ledgerResult.error,
            null,
            2
          )
        );

        console.error(
          "========================================="
        );

        setWalletLoadError(
          "Không thể tải số dư ví. Vui lòng thử lại."
        );

        setLedger([]);
      } else {
        setLedger(
          (ledgerResult.data ?? []) as Ledger[]
        );
      }

      /*
       * WITHDRAWALS
       */
      if (withdrawalResult.error) {
        console.error(
          "========== WITHDRAWAL QUERY ERROR =========="
        );

        console.error(
          "message:",
          withdrawalResult.error.message
        );

        console.error(
          "code:",
          withdrawalResult.error.code
        );

        console.error(
          "details:",
          withdrawalResult.error.details
        );

        console.error(
          "hint:",
          withdrawalResult.error.hint
        );

        console.error(
          "full:",
          JSON.stringify(
            withdrawalResult.error,
            null,
            2
          )
        );

        console.error(
          "============================================"
        );

        setWithdrawalLoadError(
          "Không thể tải lịch sử rút tiền."
        );

        setWithdrawals([]);
      } else {
        setWithdrawals(
          (withdrawalResult.data ??
            []) as Withdrawal[]
        );
      }

      if (profileResult.error) {
        console.error(
          "Profile bank query error:",
          profileResult.error
        );
        setProfileBank(null);
      } else {
        setProfileBank(
          (profileResult.data ?? null) as ProfileBank | null
        );
      }
    } catch (loadError) {
      console.error(
        "Unexpected wallet load error:",
        loadError
      );

      setWalletLoadError(
        "Có lỗi xảy ra khi tải ví. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  /*
   * Initial load
   */
  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  /*
   * Realtime
   */
  useEffect(() => {
    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    let cancelled = false;

    async function subscribeWallet() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user || cancelled) {
        return;
      }

      channel = supabase
        .channel(`wallet-realtime-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "wallet_ledger",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadWallet();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "withdrawals",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadWallet();
          }
        )
        .subscribe((status) => {
          console.log(
            "Wallet realtime status:",
            status
          );
        });
    }

    void subscribeWallet();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadWallet, supabase]);

  /*
   * Current wallet balance
   */
  const balance = useMemo(() => {
    return ledger.reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );
  }, [ledger]);

  /*
   * Total cashback
   */
  const totalCashback = useMemo(() => {
    return ledger
      .filter(
        (item) => item.type === "cashback"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [ledger]);

  /*
   * Net referral commission
   */
  const referralCommission = useMemo(() => {
    return ledger
      .filter(
        (item) =>
          item.type === "referral" ||
          item.type ===
            "referral_commission" ||
          item.type ===
            "referral_reversal"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [ledger]);

  /*
   * Total withdrawn
   */
  const totalWithdraw = useMemo(() => {
    return ledger
      .filter(
        (item) =>
          item.type === "withdraw" ||
          item.type === "withdrawal"
      )
      .reduce(
        (total, item) =>
          total +
          Math.abs(Number(item.amount || 0)),
        0
      );
  }, [ledger]);

  /*
   * Pending withdrawal
   */
  const pendingWithdrawAmount = useMemo(() => {
    return withdrawals
      .filter(
        (item) =>
          item.status === "requested" ||
          item.status === "processing"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [withdrawals]);

  /*
   * Available balance
   */
  const availableToWithdraw = Math.max(
    balance - pendingWithdrawAmount,
    0
  );

  /*
   * Withdrawal statistics
   */
  const withdrawalStats = useMemo(() => {
    return {
      total: withdrawals.length,
      pending: withdrawals.filter(
        (item) =>
          item.status === "requested" ||
          item.status === "processing"
      ).length,
      paid: withdrawals.filter(
        (item) => item.status === "paid"
      ).length,
      rejected: withdrawals.filter(
        (item) => item.status === "rejected"
      ).length,
    };
  }, [withdrawals]);

  function resetForm() {
    setAmount("");
    setError("");
  }

  function openWithdrawForm() {
    setError("");
    setSuccess("");

    if (
      !profileBank?.bank_name?.trim() ||
      !profileBank?.bank_account_name?.trim() ||
      !profileBank?.bank_account_number?.trim()
    ) {
      setError(
        "Bạn cần thiết lập đầy đủ tài khoản ngân hàng trong Hồ sơ trước khi rút tiền."
      );
      setShowWithdrawForm(true);
      return;
    }

    setShowWithdrawForm(true);
  }

  function closeWithdrawForm() {
    if (submitting) {
      return;
    }

    resetForm();
    setShowWithdrawForm(false);
  }

  /*
   * Submit withdrawal
   */
  async function submitWithdrawal(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(
      amount.replace(/[^\d]/g, "")
    );

    if (!numericAmount || numericAmount <= 0) {
      setError(
        "Vui lòng nhập số tiền hợp lệ."
      );
      return;
    }

    if (
      numericAmount >
      availableToWithdraw
    ) {
      setError(
        `Số tiền có thể rút tối đa là ${formatMoney(
          availableToWithdraw
        )}.`
      );
      return;
    }

    const bankName = profileBank?.bank_name?.trim() || "";
    const accountName =
      profileBank?.bank_account_name?.trim() || "";
    const accountNumber =
      profileBank?.bank_account_number?.trim() || "";

    if (!bankName || !accountName || !accountNumber) {
      setError(
        "Bạn chưa thiết lập đầy đủ tài khoản ngân hàng. Vui lòng cập nhật trong Hồ sơ trước khi rút tiền."
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "request_withdrawal",
        {
          p_amount: numericAmount,
          p_bank_name:
            bankName.trim(),
          p_account_name:
            accountName.trim(),
          p_account_number:
            accountNumber.trim(),
        }
      );

      if (rpcError) {
        console.error(
          "Request withdrawal error:",
          rpcError
        );

        const message =
          rpcError.message || "";

        if (
          message.includes(
            "INSUFFICIENT_AVAILABLE_BALANCE"
          )
        ) {
          throw new Error(
            "Số dư khả dụng không đủ để tạo yêu cầu này."
          );
        }

        if (
          message.includes(
            "INVALID_AMOUNT"
          )
        ) {
          throw new Error(
            "Số tiền rút không hợp lệ."
          );
        }

        if (
          message.includes(
            "UNAUTHORIZED"
          )
        ) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn."
          );
        }

        throw new Error(
          "Không thể tạo yêu cầu rút tiền."
        );
      }

      console.log(
        "Withdrawal created:",
        data
      );

      resetForm();
      setShowWithdrawForm(false);

      setSuccess(
        `Đã gửi yêu cầu rút ${formatMoney(
          numericAmount
        )}. Yêu cầu đang chờ xử lý.`
      );

      await loadWallet();
    } catch (submitError) {
      console.error(
        "Submit withdrawal error:",
        submitError
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Có lỗi xảy ra."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="w-full max-w-sm px-6 pb-24 text-center md:pb-0">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-2xl shadow-lg">
            💰
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-500">
            Đang tải ví...
          </p>
        </div>

        <MobileNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
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

              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Mua sắm · Hoàn tiền
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <Link
              href="/orders"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Đơn hàng
            </Link>

            <Link
              href="/wallet"
              className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-600"
            >
              Ví tiền
            </Link>
          </nav>

          <Link
            href="/"
            className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 md:inline-flex"
          >
            Dashboard
          </Link>

          {/* Mobile header action */}
          <Link
            href="/"
            className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-black text-emerald-600 md:hidden"
          >
            + Mua sắm
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-28 pt-8 md:pb-10 md:py-10">
        {/* Heading */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ví tiền
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Tiền hoàn của bạn
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500 md:text-base">
            Theo dõi số dư, yêu cầu rút tiền và
            toàn bộ biến động trong ví.
          </p>
        </div>

        {/* Errors */}
        {walletLoadError && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>
              ⚠ {walletLoadError}
            </span>

            <button
              type="button"
              onClick={() => void loadWallet()}
              className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
            >
              Thử lại
            </button>
          </div>
        )}

        {withdrawalLoadError && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span>
              ⚠ {withdrawalLoadError} Một số thông tin
              có thể chưa hiển thị.
            </span>

            <button
              type="button"
              onClick={() => void loadWallet()}
              className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-50"
            >
              Tải lại
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 sm:flex-row sm:items-center sm:justify-between">
            <span>✓ {success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="self-start rounded-lg px-2 py-1 text-lg leading-none text-emerald-600 transition hover:bg-emerald-100 sm:self-auto"
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        )}

        {/* Balance Hero */}
        <section className="relative mt-8 overflow-hidden rounded-[28px] bg-gray-900 p-6 text-white shadow-xl sm:p-7 md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  💰
                </span>
                Số dư hiện tại
              </div>

              <div className="mt-4 break-words text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                {formatMoney(balance)}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <div className="text-xs text-gray-400">
                    Có thể rút
                  </div>

                  <div className="mt-1 text-base font-black text-emerald-300">
                    {formatMoney(
                      availableToWithdraw
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <div className="text-xs text-gray-400">
                    Đang chờ rút
                  </div>

                  <div className="mt-1 text-base font-black text-amber-300">
                    {formatMoney(
                      pendingWithdrawAmount
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:min-w-[190px]">
              <button
                type="button"
                onClick={openWithdrawForm}
                disabled={
                  availableToWithdraw <= 0
                }
                className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 lg:min-w-[190px]"
              >
                <span className="mr-2">
                  ↗
                </span>
                Rút tiền
              </button>

              {availableToWithdraw <= 0 && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Chưa có số dư khả dụng
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="↗"
            iconClass="bg-emerald-50 text-emerald-600"
            label="Tổng hoàn tiền"
            value={formatMoney(totalCashback)}
            valueClass="text-emerald-600"
          />

          <StatCard
            icon="★"
            iconClass="bg-emerald-50 text-emerald-600"
            label="Hoa hồng giới thiệu"
            value={formatMoney(
              referralCommission
            )}
            valueClass="text-emerald-600"
          />

          <StatCard
            icon="↙"
            iconClass="bg-blue-50 text-blue-600"
            label="Đã rút"
            value={formatMoney(totalWithdraw)}
          />

          <StatCard
            icon="↔"
            iconClass="bg-gray-100 text-gray-600"
            label="Giao dịch"
            value={String(ledger.length)}
          />
        </section>

        {/* Withdrawal Form */}
        {showWithdrawForm && (
          <section className="mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-6 md:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      ↗
                    </div>

                    <h2 className="text-xl font-black">
                      Tạo yêu cầu rút tiền
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Số tiền khả dụng tối đa:{" "}
                    <span className="font-black text-emerald-600">
                      {formatMoney(
                        availableToWithdraw
                      )}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeWithdrawForm}
                  disabled={submitting}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-50"
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-7">
              {error && (
                <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={submitWithdrawal}
                className="grid gap-5 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">
                    Số tiền rút
                  </label>

                  <div className="relative mt-2">
                    <input
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value.replace(
                            /[^\d]/g,
                            ""
                          )
                        )
                      }
                      inputMode="numeric"
                      placeholder="Ví dụ: 20000"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 pr-14 text-xl font-black outline-none transition placeholder:text-gray-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />

                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                      ₫
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    Bạn có thể rút tối đa{" "}
                    <span className="font-bold text-gray-600">
                      {formatMoney(
                        availableToWithdraw
                      )}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {profileBank?.bank_name &&
                  profileBank?.bank_account_name &&
                  profileBank?.bank_account_number ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                            Tài khoản nhận tiền
                          </div>
                          <div className="mt-2 font-black text-gray-900">
                            {profileBank.bank_name}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-700">
                            {profileBank.bank_account_name}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            STK: {maskAccount(profileBank.bank_account_number)}
                          </div>
                        </div>

                        <Link
                          href="/profile"
                          className="shrink-0 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-center text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Đổi tài khoản
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                      <div className="font-black text-amber-900">
                        Chưa có tài khoản nhận tiền
                      </div>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Hãy thêm ngân hàng, số tài khoản và tên chủ tài khoản trong Hồ sơ trước khi gửi yêu cầu rút tiền.
                      </p>
                      <Link
                        href="/profile"
                        className="mt-4 inline-flex rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-800"
                      >
                        Thiết lập tài khoản ngân hàng
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-end gap-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={closeWithdrawForm}
                    disabled={submitting}
                    className="rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !profileBank?.bank_name ||
                      !profileBank?.bank_account_name ||
                      !profileBank?.bank_account_number
                    }
                    className="rounded-2xl bg-gray-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Đang gửi..."
                      : "Gửi yêu cầu"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Withdrawal Section */}
        <section className="mt-8 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6 md:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Yêu cầu rút tiền
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Theo dõi trạng thái các yêu cầu rút tiền.
                </p>
              </div>

              {withdrawals.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <MiniStatus
                    label="Tổng"
                    value={withdrawalStats.total}
                  />

                  <MiniStatus
                    label="Chờ"
                    value={withdrawalStats.pending}
                  />

                  <MiniStatus
                    label="Đã trả"
                    value={withdrawalStats.paid}
                  />
                </div>
              )}
            </div>
          </div>

          {withdrawalLoadError ? (
            <EmptyState
              icon="⚠️"
              title="Chưa tải được lịch sử rút tiền"
              description="Số dư ví vẫn hoạt động bình thường. Hãy thử tải lại để lấy danh sách yêu cầu rút tiền."
              actionLabel="Tải lại"
              onAction={() => void loadWallet()}
            />
          ) : withdrawals.length === 0 ? (
            <EmptyState
              icon="🏦"
              title="Chưa có yêu cầu rút tiền"
              description="Khi bạn tạo yêu cầu rút tiền, trạng thái sẽ được hiển thị tại đây."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((item) => (
                <WithdrawalRow
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          )}
        </section>

        {/* Ledger */}
        <section className="mt-8 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6 md:px-7">
            <h2 className="text-xl font-black">
              Lịch sử ví
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Các giao dịch cộng và trừ tiền trong tài khoản.
            </p>
          </div>

          {ledger.length === 0 ? (
            <EmptyState
              icon="💰"
              title="Ví chưa có giao dịch"
              description="Khi đơn hàng được duyệt, tiền hoàn sẽ được cộng vào ví của bạn."
              actionLabel="Tiếp tục mua sắm"
              actionHref="/"
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {ledger.map((item) => {
                const numericAmount =
                  Number(item.amount || 0);

                const positive =
                  numericAmount > 0;

                const negative =
                  numericAmount < 0;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-gray-50/70 sm:flex-row sm:items-center sm:justify-between md:px-7 md:py-5"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black ${getLedgerIconClass(
                          item.type,
                          numericAmount
                        )}`}
                      >
                        {getLedgerIcon(
                          item.type,
                          numericAmount
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">
                          {getTypeLabel(
                            item.type
                          )}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          {formatDate(
                            item.created_at
                          )}
                        </div>

                        {item.order_id && (
                          <div className="mt-1 truncate font-mono text-[10px] text-gray-400">
                            Order:{" "}
                            {item.order_id}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`text-lg font-black sm:text-right ${
                        positive
                          ? "text-emerald-600"
                          : negative
                          ? "text-gray-800"
                          : "text-gray-500"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {formatMoney(
                        numericAmount
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How wallet works */}
        <section className="mt-8 overflow-hidden rounded-[28px] border border-emerald-100 bg-emerald-50">
          <div className="p-5 sm:p-6 md:p-7">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                💡
              </div>

              <div>
                <h3 className="font-black text-emerald-950">
                  Tiền hoàn hoạt động như thế nào?
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Sau khi bạn mua hàng bằng affiliate
                  link, đơn hàng sẽ được đối soát. Khi
                  đơn được duyệt, tiền hoàn tương ứng
                  sẽ được cộng vào ví. Nếu người bạn
                  giới thiệu có đơn đủ điều kiện, hoa
                  hồng giới thiệu cũng được ghi nhận
                  vào ví. Các khoản đã ghi nhận có thể
                  được hoàn tác nếu đơn sau đó bị từ
                  chối.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <InfoStep
                number="01"
                title="Mua hàng"
                description="Mua bằng link hoàn tiền của bạn."
              />

              <InfoStep
                number="02"
                title="Đơn được duyệt"
                description="Tiền hoàn được cộng vào ví."
              />

              <InfoStep
                number="03"
                title="Rút tiền"
                description="Gửi yêu cầu và nhận tiền về ngân hàng."
              />
            </div>
          </div>
        </section>

        <footer className="py-10 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Hoàn Tiền Sale
        </footer>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </main>
  );
}

/*
 * Stat card
 */
function StatCard({
  icon,
  iconClass,
  label,
  value,
  valueClass = "text-gray-900",
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-gray-500">
          {label}
        </span>

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black ${iconClass}`}
        >
          {icon}
        </span>
      </div>

      <div
        className={`mt-4 text-xl font-black tracking-tight ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

/*
 * Mini status
 */
function MiniStatus({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-600">
      {label}{" "}
      <span className="font-black text-gray-900">
        {value}
      </span>
    </span>
  );
}

/*
 * Withdrawal row
 */
function WithdrawalRow({
  item,
}: {
  item: Withdrawal;
}) {
  return (
    <div className="p-5 transition hover:bg-gray-50/60 md:px-7 md:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              item.status === "paid"
                ? "bg-emerald-50 text-emerald-600"
                : item.status === "rejected"
                ? "bg-red-50 text-red-600"
                : item.status === "processing"
                ? "bg-blue-50 text-blue-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {item.status === "paid"
              ? "✓"
              : item.status === "rejected"
              ? "×"
              : "↗"}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-black">
                {formatMoney(
                  Number(item.amount || 0)
                )}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${withdrawalStatusClass(
                  item.status
                )}`}
              >
                {withdrawalStatusLabel(
                  item.status
                )}
              </span>
            </div>

            <div className="mt-2 text-xs text-gray-400">
              Tạo lúc{" "}
              {formatDate(item.created_at)}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
              <span className="font-semibold">
                {item.bank_name || "—"}
              </span>

              <span className="text-gray-300">
                ·
              </span>

              <span>
                {maskAccount(
                  item.account_number
                )}
              </span>
            </div>

            {item.account_name && (
              <div className="mt-1 text-xs text-gray-400">
                {item.account_name}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-left lg:min-w-[190px] lg:text-right">
          {item.status === "paid" &&
          item.processed_at ? (
            <>
              <div className="text-xs font-bold text-emerald-600">
                ✓ Đã thanh toán
              </div>

              <div className="mt-1 text-xs text-gray-400">
                {formatDate(
                  item.processed_at
                )}
              </div>
            </>
          ) : item.status === "rejected" ? (
            <div className="text-xs font-bold text-red-600">
              Yêu cầu bị từ chối
            </div>
          ) : item.status === "processing" ? (
            <div className="text-xs font-bold text-blue-600">
              Đang xử lý
            </div>
          ) : (
            <div className="text-xs font-bold text-amber-600">
              Đang chờ xử lý
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * Empty state
 */
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  return (
    <div className="px-6 py-14 text-center md:py-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
        {icon}
      </div>

      <h3 className="mt-5 font-black text-gray-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/*
 * Info step
 */
function InfoStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-black text-emerald-700">
          {number}
        </span>

        <span className="font-black text-emerald-950">
          {title}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-emerald-800/80">
        {description}
      </p>
    </div>
  );
}