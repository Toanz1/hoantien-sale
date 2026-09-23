"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import MobileNav from "@/components/MobileNav";
import { createClient } from "@/lib/supabase/client";

type UserInfo = {
  id: string;
  email: string;
  createdAt: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  referral_code: string | null;
  referred_by: string | null;
};

type WalletRow = {
  amount: number | string | null;
  type: string | null;
};

type OrderRow = {
  id: string;
  status: string;
  cashback: number | string | null;
};

const PROFILE_SELECT =
  "id,full_name,phone,role,created_at,bank_name,bank_account_number,bank_account_name,referral_code,referred_by";

const VIETNAM_BANKS = [
  "Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam",
  "BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
  "VietinBank - Ngân hàng TMCP Công Thương Việt Nam",
  "Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
  "MB Bank - Ngân hàng TMCP Quân Đội",
  "Techcombank - Ngân hàng TMCP Kỹ Thương Việt Nam",
  "ACB - Ngân hàng TMCP Á Châu",
  "VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng",
  "TPBank - Ngân hàng TMCP Tiên Phong",
  "VIB - Ngân hàng TMCP Quốc Tế Việt Nam",
  "HDBank - Ngân hàng TMCP Phát triển TP.HCM",
  "Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín",
  "SHB - Ngân hàng TMCP Sài Gòn - Hà Nội",
  "MSB - Ngân hàng TMCP Hàng Hải Việt Nam",
  "OCB - Ngân hàng TMCP Phương Đông",
  "LPBank - Ngân hàng TMCP Lộc Phát Việt Nam",
  "Eximbank - Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam",
  "SeABank - Ngân hàng TMCP Đông Nam Á",
  "Nam A Bank - Ngân hàng TMCP Nam Á",
  "Bac A Bank - Ngân hàng TMCP Bắc Á",
  "ABBANK - Ngân hàng TMCP An Bình",
  "VietABank - Ngân hàng TMCP Việt Á",
  "KienlongBank - Ngân hàng TMCP Kiên Long",
  "BVBank - Ngân hàng TMCP Bản Việt",
  "Saigonbank - Ngân hàng TMCP Sài Gòn Công Thương",
  "PGBank - Ngân hàng TMCP Thịnh Vượng và Phát triển",
  "CAKE by VPBank",
  "Ubank by VPBank",
  "Timo by BVBank",
] as const;

function formatMoney(value: number) {
  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(value || 0) + " ₫"
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitial(name: string, email: string) {
  const value = name.trim() || email.trim() || "U";
  return value[0].toUpperCase();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+\s.-]/g, "");
}

function normalizeAccountNumber(value: string) {
  return value.replace(/\D/g, "");
}

function hasBankInformation(profile: Profile | null) {
  return Boolean(
    profile?.bank_name?.trim() &&
      profile?.bank_account_number?.trim() &&
      profile?.bank_account_name?.trim()
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<UserInfo | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [walletRows, setWalletRows] =
    useState<WalletRow[]>([]);

  const [orders, setOrders] =
    useState<OrderRow[]>([]);

  const [invitedCount, setInvitedCount] =
    useState(0);

  const [
    referralCommission,
    setReferralCommission,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // Personal information
  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  // Bank information
  const [editingBank, setEditingBank] =
    useState(false);

  const [savingBank, setSavingBank] =
    useState(false);

  const [bankName, setBankName] =
    useState("");

  const [
    bankAccountNumber,
    setBankAccountNumber,
  ] = useState("");

  const [
    bankAccountName,
    setBankAccountName,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError || !authUser) {
          router.replace(
            `/login?next=${encodeURIComponent(
              "/profile"
            )}`
          );

          return;
        }

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          createdAt:
            authUser.created_at || null,
        });

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          try {
            const adminResponse = await fetch(
              "/api/admin/me",
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
                cache: "no-store",
              }
            );

            if (active) {
              setIsAdmin(adminResponse.ok);
            }
          } catch (adminError) {
            console.error("Admin permission check error:", adminError);
            if (active) setIsAdmin(false);
          }
        } else if (active) {
          setIsAdmin(false);
        }

        const [
          profileResult,
          walletResult,
          ordersResult,
          referralStatsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(PROFILE_SELECT)
            .eq("id", authUser.id)
            .maybeSingle(),

          supabase
            .from("wallet_ledger")
            .select("amount,type")
            .eq("user_id", authUser.id),

          supabase
            .from("orders")
            .select("id,status,cashback")
            .eq("user_id", authUser.id),

          supabase.rpc(
            "get_my_referral_stats"
          ),
        ]);

        if (!active) return;

        if (profileResult.error) {
          console.error(
            "Load profile row error:",
            profileResult.error
          );

          setError(
            "Không thể tải thông tin cá nhân."
          );
        } else if (profileResult.data) {
          const row =
            profileResult.data as Profile;

          setProfile(row);

          setFullName(
            row.full_name || ""
          );

          setPhone(
            row.phone || ""
          );

          setBankName(
            row.bank_name || ""
          );

          setBankAccountNumber(
            row.bank_account_number || ""
          );

          setBankAccountName(
            row.bank_account_name || ""
          );
        }

        if (walletResult.error) {
          console.error(
            "Profile wallet error:",
            walletResult.error
          );
        } else {
          setWalletRows(
            (walletResult.data ||
              []) as WalletRow[]
          );
        }

        if (ordersResult.error) {
          console.error(
            "Profile orders error:",
            ordersResult.error
          );
        } else {
          setOrders(
            (ordersResult.data ||
              []) as OrderRow[]
          );
        }

        if (referralStatsResult.error) {
          console.error(
            "Profile referral stats error:",
            referralStatsResult.error
          );

          setInvitedCount(0);
          setReferralCommission(0);
        } else {
          const stats =
            referralStatsResult.data as {
              invited_count?: number | string;
              net_referral_commission?:
                | number
                | string;
            } | null;

          setInvitedCount(
            Number(
              stats?.invited_count ?? 0
            )
          );

          setReferralCommission(
            Number(
              stats?.net_referral_commission ??
                0
            )
          );
        }
      } catch (err) {
        console.error(
          "Load profile error:",
          err
        );

        if (active) {
          setError(
            "Không thể tải thông tin tài khoản. Vui lòng thử lại."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const balance = useMemo(() => {
    return walletRows.reduce(
      (total, row) =>
        total +
        Number(row.amount || 0),
      0
    );
  }, [walletRows]);

  const totalCashback = useMemo(() => {
    return walletRows
      .filter(
        (row) =>
          row.type === "cashback"
      )
      .reduce(
        (total, row) =>
          total +
          Number(row.amount || 0),
        0
      );
  }, [walletRows]);

  const approvedOrders =
    useMemo(() => {
      return orders.filter(
        (order) =>
          order.status === "approved" ||
          order.status === "paid"
      ).length;
    }, [orders]);

  const referralLink = useMemo(() => {
    const code =
      profile?.referral_code?.trim();

    if (!code) return "";

    if (typeof window === "undefined") {
      return `/register?ref=${encodeURIComponent(
        code
      )}`;
    }

    return `${
      window.location.origin
    }/register?ref=${encodeURIComponent(
      code
    )}`;
  }, [profile?.referral_code]);

  const bankReady =
    hasBankInformation(profile);

  const displayName =
    profile?.full_name?.trim() ||
    user?.email ||
    "Thành viên";

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function showSuccess(
    message: string
  ) {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  }

  async function copyReferral(
    value: string,
    label: string
  ) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(
        value
      );

      showSuccess(
        `${label} đã được sao chép.`
      );
    } catch (err) {
      console.error(
        "Copy referral error:",
        err
      );

      setError(
        "Không thể sao chép. Vui lòng thử lại."
      );
    }
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user || saving) {
      return;
    }

    clearMessages();

    const cleanName =
      fullName.trim();

    const cleanPhone =
      phone.trim();

    if (!cleanName) {
      setError(
        "Vui lòng nhập họ và tên."
      );

      return;
    }

    if (
      cleanPhone &&
      !/^[0-9+\s.-]{8,20}$/.test(
        cleanPhone
      )
    ) {
      setError(
        "Số điện thoại không hợp lệ."
      );

      return;
    }

    setSaving(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          phone:
            cleanPhone || null,
        })
        .eq("id", user.id)
        .select(PROFILE_SELECT)
        .single();

      if (updateError) {
        console.error(
          "Update profile error:",
          updateError
        );

        setError(
          "Không thể cập nhật thông tin. Vui lòng thử lại."
        );

        return;
      }

      const updated =
        data as Profile;

      setProfile(updated);

      setFullName(
        updated.full_name || ""
      );

      setPhone(
        updated.phone || ""
      );

      setBankName(
        updated.bank_name || ""
      );

      setBankAccountNumber(
        updated.bank_account_number || ""
      );

      setBankAccountName(
        updated.bank_account_name || ""
      );

      setEditing(false);

      showSuccess(
        "Thông tin cá nhân đã được cập nhật."
      );
    } catch (err) {
      console.error(
        "Save profile error:",
        err
      );

      setError(
        "Có lỗi kết nối đến hệ thống."
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setFullName(
      profile?.full_name || ""
    );

    setPhone(
      profile?.phone || ""
    );

    setEditing(false);
    setError("");
  }

  async function saveBank(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user || savingBank) {
      return;
    }

    clearMessages();

    const cleanBankName =
      bankName.trim();

    const cleanAccountNumber =
      bankAccountNumber.trim();

    const cleanAccountName =
      bankAccountName
        .trim()
        .toUpperCase();

    if (!cleanBankName) {
      setError(
        "Vui lòng chọn ngân hàng."
      );

      return;
    }

    if (!cleanAccountNumber) {
      setError(
        "Vui lòng nhập số tài khoản."
      );

      return;
    }

    if (
      !/^[0-9]{5,30}$/.test(
        cleanAccountNumber
      )
    ) {
      setError(
        "Số tài khoản ngân hàng không hợp lệ."
      );

      return;
    }

    if (!cleanAccountName) {
      setError(
        "Vui lòng nhập tên chủ tài khoản."
      );

      return;
    }

    setSavingBank(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          bank_name:
            cleanBankName,
          bank_account_number:
            cleanAccountNumber,
          bank_account_name:
            cleanAccountName,
        })
        .eq("id", user.id)
        .select(PROFILE_SELECT)
        .single();

      if (updateError) {
        console.error(
          "Update bank information error:",
          updateError
        );

        setError(
          "Không thể lưu thông tin ngân hàng. Vui lòng thử lại."
        );

        return;
      }

      const updated =
        data as Profile;

      setProfile(updated);

      setFullName(
        updated.full_name || ""
      );

      setPhone(
        updated.phone || ""
      );

      setBankName(
        updated.bank_name || ""
      );

      setBankAccountNumber(
        updated.bank_account_number || ""
      );

      setBankAccountName(
        updated.bank_account_name || ""
      );

      setEditingBank(false);

      showSuccess(
        "Thông tin tài khoản nhận tiền đã được cập nhật."
      );
    } catch (err) {
      console.error(
        "Save bank information error:",
        err
      );

      setError(
        "Có lỗi kết nối đến hệ thống."
      );
    } finally {
      setSavingBank(false);
    }
  }

  function cancelBankEdit() {
    setBankName(
      profile?.bank_name || ""
    );

    setBankAccountNumber(
      profile?.bank_account_number || ""
    );

    setBankAccountName(
      profile?.bank_account_name || ""
    );

    setEditingBank(false);
    setError("");
  }

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase =
        createClient();

      await supabase.auth.signOut();

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );

      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] pb-24 md:pb-0">
        <Header />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="h-[460px] animate-pulse rounded-[28px] bg-gray-200" />

            <div>
              <div className="h-40 animate-pulse rounded-[28px] bg-gray-200" />

              <div className="mt-6 h-80 animate-pulse rounded-[28px] bg-gray-200" />
            </div>
          </div>
        </div>

        <MobileNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-24 text-gray-900 md:pb-0">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-9">
        {/* TITLE */}
        <div className="mb-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
            Tài khoản
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Trang cá nhân
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Quản lý thông tin, đơn hàng
            và tiền hoàn của bạn.
          </p>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 font-black">
              !
            </div>

            <div className="pt-1">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
              ✓
            </span>

            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* SIDEBAR */}
          <aside className="h-fit overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-black text-white shadow-sm shadow-emerald-200">
                  {getInitial(
                    profile?.full_name ||
                      "",
                    user?.email || ""
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate font-black">
                    {displayName}
                  </div>

                  <div className="mt-1 truncate text-xs text-gray-500">
                    {user?.email || "—"}
                  </div>

                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    {isAdmin ? "Quản trị viên" : "Thành viên"}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                <div className="text-xs font-bold text-emerald-700">
                  Số dư hiện tại
                </div>

                <div className="mt-1 text-2xl font-black text-emerald-700">
                  {formatMoney(balance)}
                </div>
              </div>
            </div>

            <nav className="p-3">
              <SideLink
                href="/profile"
                icon="👤"
                active
              >
                Thông tin tài khoản
              </SideLink>

              <SideLink
                href="/orders"
                icon="📦"
              >
                Đơn hàng
              </SideLink>

              <SideLink
                href="/wallet"
                icon="💰"
              >
                Ví & rút tiền
              </SideLink>

              <SideLink
                href="/profile/change-password"
                icon="🔒"
              >
                Đổi mật khẩu
              </SideLink>

              {isAdmin && (
                <>
                  <div className="my-3 border-t border-gray-100" />
                  <SideLink href="/admin" icon="🛡️">
                    Quản trị hệ thống
                  </SideLink>
                </>
              )}

              <div className="my-3 border-t border-gray-100" />

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                  ↪
                </span>

                {loggingOut
                  ? "Đang đăng xuất..."
                  : "Đăng xuất"}
              </button>
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <section className="min-w-0">
            {/* HERO */}
            <div className="overflow-hidden rounded-[28px] bg-gray-950 p-6 text-white shadow-lg sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">
                    Xin chào
                  </div>

                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    {displayName}
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Thành viên từ{" "}
                    {formatDate(
                      profile?.created_at ||
                        user?.createdAt ||
                        null
                    )}
                  </p>
                </div>

                <Link
                  href="/"
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-5 text-sm font-black text-white transition hover:bg-emerald-400"
                >
                  + Tạo link hoàn tiền
                </Link>
              </div>
            </div>

            {/* STATS */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Số dư"
                value={formatMoney(
                  balance
                )}
                href="/wallet"
                linkLabel="Xem ví"
                green
              />

              <StatCard
                label="Tổng tiền hoàn"
                value={formatMoney(
                  totalCashback
                )}
                footer="Từ lịch sử ví"
              />

              <StatCard
                label="Đơn được duyệt"
                value={String(
                  approvedOrders
                )}
                href="/orders"
                linkLabel="Xem đơn hàng"
              />
            </div>

            {/* PERSONAL INFORMATION */}
            <div className="mt-5 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <h2 className="text-lg font-black">
                    Thông tin cá nhân
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Thông tin dùng cho tài
                    khoản Hoàn Tiền Sale.
                  </p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setEditing(true);
                    }}
                    className="inline-flex h-11 w-fit items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition hover:bg-gray-50"
                  >
                    ✎ Chỉnh sửa thông tin
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="divide-y divide-gray-100 px-6 sm:px-7">
                  <InfoRow
                    label="Họ và tên"
                    value={
                      profile?.full_name ||
                      "Chưa cập nhật"
                    }
                  />

                  <InfoRow
                    label="Số điện thoại"
                    value={
                      profile?.phone ||
                      "Chưa cập nhật"
                    }
                  />

                  <InfoRow
                    label="Email"
                    value={
                      user?.email || "—"
                    }
                    verified
                  />

                  <InfoRow
                    label="Loại tài khoản"
                    value={isAdmin ? "Quản trị viên" : "Thành viên"}
                  />
                </div>
              ) : (
                <form
                  onSubmit={saveProfile}
                  className="p-6 sm:p-7"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="Họ và tên"
                      required
                    >
                      <input
                        value={fullName}
                        onChange={(e) =>
                          setFullName(
                            e.target.value
                          )
                        }
                        disabled={saving}
                        autoComplete="name"
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                      />
                    </FormField>

                    <FormField label="Số điện thoại">
                      <input
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            normalizePhone(
                              e.target.value
                            )
                          )
                        }
                        disabled={saving}
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="0912345678"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                      />
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField label="Email">
                        <input
                          value={
                            user?.email || ""
                          }
                          disabled
                          className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3.5 text-sm font-semibold text-gray-500"
                        />
                      </FormField>

                      <p className="mt-2 text-xs text-gray-400">
                        Email đăng nhập không
                        thay đổi tại đây.
                      </p>
                    </div>
                  </div>

                  <FormActions
                    saving={saving}
                    savingLabel="Đang lưu..."
                    submitLabel="Lưu thay đổi"
                    onCancel={cancelEdit}
                  />
                </form>
              )}
            </div>

            {/* ACCOUNT INFORMATION */}
            <div className="mt-5 rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6 sm:px-7">
                <h2 className="text-lg font-black">
                  Thông tin tài khoản
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Thông tin hệ thống của tài khoản.
                </p>
              </div>

              <div className="divide-y divide-gray-100 px-6 sm:px-7">
                <InfoRow
                  label="Mã thành viên"
                  value={
                    profile?.referral_code ||
                    "Đang cập nhật"
                  }
                  mono
                />

                <InfoRow
                  label="Ngày tham gia"
                  value={formatDate(
                    profile?.created_at ||
                      user?.createdAt ||
                      null
                  )}
                />
              </div>
            </div>

            {/* REFERRAL */}
            <div className="mt-5 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
              <div className="border-b border-emerald-100 bg-emerald-50/60 p-6 sm:px-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white">
                    🎁
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-gray-950">
                      Mời bạn bè
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Chia sẻ mã hoặc link giới thiệu.
                      Khi người được bạn mời phát sinh
                      đơn đủ điều kiện, hoa hồng giới
                      thiệu sẽ được ghi nhận vào ví.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReferralValue
                    label="Mã giới thiệu"
                    value={
                      profile?.referral_code ||
                      "Chưa có mã"
                    }
                    onCopy={
                      profile?.referral_code
                        ? () =>
                            copyReferral(
                              profile.referral_code!,
                              "Mã giới thiệu"
                            )
                        : undefined
                    }
                  />

                  <ReferralValue
                    label="Link giới thiệu"
                    value={
                      referralLink ||
                      "Chưa có link"
                    }
                    onCopy={
                      referralLink
                        ? () =>
                            copyReferral(
                              referralLink,
                              "Link giới thiệu"
                            )
                        : undefined
                    }
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <div className="text-xs font-bold text-gray-500">
                      Người đã giới thiệu
                    </div>

                    <div className="mt-2 text-2xl font-black text-gray-950">
                      {invitedCount}
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                      tài khoản
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <div className="text-xs font-bold text-emerald-700">
                      Hoa hồng giới thiệu
                    </div>

                    <div className="mt-2 text-2xl font-black text-emerald-700">
                      {formatMoney(
                        referralCommission
                      )}
                    </div>

                    <div className="mt-1 text-xs text-emerald-600">
                      Hoa hồng ròng đã ghi nhận
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-medium leading-5 text-amber-800">
                  Hoa hồng chỉ được tính khi đơn
                  hàng của người được mời đạt trạng
                  thái đủ điều kiện. Nếu đơn bị từ
                  chối sau khi đã ghi nhận, hệ thống
                  có thể tạo giao dịch hoàn tác tương
                  ứng.
                </div>
              </div>
            </div>

            {/* BANK INFORMATION */}
            <div className="mt-5 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black">
                      Tài khoản nhận tiền
                    </h2>

                    {bankReady ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                        ✓ Đã thiết lập
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
                        Chưa thiết lập
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Tài khoản ngân hàng dùng
                    để nhận tiền khi yêu cầu
                    rút tiền.
                  </p>
                </div>

                {!editingBank && (
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setEditingBank(true);
                    }}
                    className="inline-flex h-11 w-fit items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition hover:bg-gray-50"
                  >
                    {bankReady
                      ? "✎ Chỉnh sửa"
                      : "+ Thêm tài khoản"}
                  </button>
                )}
              </div>

              {!editingBank ? (
                bankReady ? (
                  <>
                    <div className="divide-y divide-gray-100 px-6 sm:px-7">
                      <InfoRow
                        label="Ngân hàng"
                        value={
                          profile?.bank_name ||
                          "—"
                        }
                      />

                      <InfoRow
                        label="Số tài khoản"
                        value={
                          profile?.bank_account_number ||
                          "—"
                        }
                        mono
                      />

                      <InfoRow
                        label="Tên chủ tài khoản"
                        value={
                          profile?.bank_account_name ||
                          "—"
                        }
                      />
                    </div>

                    <div className="border-t border-gray-100 p-6 sm:px-7">
                      <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                          ✓
                        </div>

                        <p className="text-sm leading-6 text-emerald-800">
                          Khi yêu cầu rút tiền,
                          hệ thống sẽ sử dụng
                          tài khoản ngân hàng
                          này để xử lý thanh
                          toán.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 sm:p-7">
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center">
                      <div className="text-3xl">
                        🏦
                      </div>

                      <div className="mt-3 font-black">
                        Chưa có tài khoản nhận
                        tiền
                      </div>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                        Thêm thông tin ngân hàng
                        để sử dụng khi yêu cầu
                        rút tiền hoàn.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          clearMessages();
                          setEditingBank(true);
                        }}
                        className="mt-5 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
                      >
                        + Thêm tài khoản ngân hàng
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <form
                  onSubmit={saveBank}
                  className="p-6 sm:p-7"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="Ngân hàng"
                      required
                    >
                      <div className="relative">
                        <select
                          value={bankName}
                          onChange={(e) =>
                            setBankName(
                              e.target.value
                            )
                          }
                          disabled={savingBank}
                          required
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            -- Chọn ngân hàng --
                          </option>

                          {bankName &&
                            !VIETNAM_BANKS.includes(
                              bankName as (typeof VIETNAM_BANKS)[number]
                            ) && (
                              <option value={bankName}>
                                {bankName}
                              </option>
                            )}

                          {VIETNAM_BANKS.map(
                            (bank) => (
                              <option
                                key={bank}
                                value={bank}
                              >
                                {bank}
                              </option>
                            )
                          )}
                        </select>

                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-gray-400">
                          ▼
                        </span>
                      </div>
                    </FormField>

                    <FormField
                      label="Số tài khoản"
                      required
                    >
                      <input
                        value={
                          bankAccountNumber
                        }
                        onChange={(e) =>
                          setBankAccountNumber(
                            normalizeAccountNumber(
                              e.target.value
                            )
                          )
                        }
                        disabled={savingBank}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="Nhập số tài khoản"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                      />
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField
                        label="Tên chủ tài khoản"
                        required
                      >
                        <input
                          value={
                            bankAccountName
                          }
                          onChange={(e) =>
                            setBankAccountName(
                              e.target.value.toUpperCase()
                            )
                          }
                          disabled={savingBank}
                          autoComplete="off"
                          placeholder="NGUYEN VAN A"
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold uppercase outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                        />
                      </FormField>

                      <p className="mt-2 text-xs leading-5 text-gray-400">
                        Nhập đúng tên chủ tài
                        khoản ngân hàng để tránh
                        sai thông tin khi xử lý
                        rút tiền.
                      </p>
                    </div>
                  </div>

                  <FormActions
                    saving={savingBank}
                    savingLabel="Đang lưu..."
                    submitLabel="Lưu tài khoản"
                    onCancel={
                      cancelBankEdit
                    }
                  />
                </form>
              )}
            </div>

            {/* QUICK LINKS */}
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <QuickLink
                href="/orders"
                icon="📦"
                title="Đơn hàng của tôi"
                description="Theo dõi trạng thái và tiền hoàn của các đơn hàng."
              />

              <QuickLink
                href="/wallet"
                icon="💰"
                title="Ví & rút tiền"
                description="Kiểm tra số dư, lịch sử giao dịch và yêu cầu rút tiền."
              />

              {isAdmin && (
                <QuickLink
                  href="/admin"
                  icon="🛡️"
                  title="Quản trị hệ thống"
                  description="Quản lý người dùng, đơn hàng, đối soát và yêu cầu rút tiền."
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <MobileNav />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 font-black text-white shadow-sm shadow-emerald-200">
            H
          </div>

          <div>
            <div className="text-sm font-black sm:text-base">
              Hoàn Tiền Sale
            </div>

            <div className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 sm:block">
              Mua sắm · Nhận tiền
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Trang chủ
          </Link>

          <Link
            href="/orders"
            className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Đơn hàng
          </Link>

          <Link
            href="/wallet"
            className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Ví tiền
          </Link>

          <Link
            href="/profile"
            className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"
          >
            Tài khoản
          </Link>
        </nav>

        <Link
          href="/"
          className="rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-gray-800 md:hidden"
        >
          + Tạo link
        </Link>
      </div>
    </header>
  );
}

function SideLink({
  href,
  icon,
  children,
  active = false,
}: {
  href: string;
  icon: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`mt-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition ${
        active
          ? "bg-emerald-50 font-black text-emerald-700"
          : "font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-950"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          active
            ? "bg-white"
            : "bg-gray-50"
        }`}
      >
        {icon}
      </span>

      {children}
    </Link>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  verified = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  verified?: boolean;
}) {
  const empty =
    value === "Chưa cập nhật";

  return (
    <div className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-bold text-gray-500">
        {label}
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div
          className={`break-all text-sm font-bold ${
            empty
              ? "text-gray-400"
              : "text-gray-900"
          } ${
            mono
              ? "font-mono text-xs"
              : ""
          }`}
        >
          {value}
        </div>

        {verified && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
            Đã xác minh
          </span>
        )}
      </div>
    </div>
  );
}

function ReferralValue({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs font-bold text-gray-500">
        {label}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1 break-all font-mono text-xs font-black text-gray-900">
          {value}
        </div>

        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            Sao chép
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function FormActions({
  saving,
  savingLabel,
  submitLabel,
  onCancel,
}: {
  saving: boolean;
  savingLabel: string;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="h-12 rounded-2xl border border-gray-200 bg-white px-6 text-sm font-black text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        Hủy
      </button>

      <button
        type="submit"
        disabled={saving}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}

        {saving
          ? savingLabel
          : submitLabel}
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  linkLabel,
  footer,
  green = false,
}: {
  label: string;
  value: string;
  href?: string;
  linkLabel?: string;
  footer?: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold text-gray-400">
        {label}
      </div>

      <div
        className={`mt-2 text-2xl font-black ${
          green
            ? "text-emerald-600"
            : "text-gray-900"
        }`}
      >
        {value}
      </div>

      {href && linkLabel ? (
        <Link
          href={href}
          className="mt-4 inline-flex text-xs font-black text-emerald-600"
        >
          {linkLabel} →
        </Link>
      ) : (
        <div className="mt-4 text-xs font-medium text-gray-400">
          {footer}
        </div>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
          {icon}
        </div>

        <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-900">
          →
        </span>
      </div>

      <div className="mt-5 font-black">
        {title}
      </div>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </Link>
  );
}