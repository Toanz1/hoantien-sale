"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  referral_code: string | null;
};

function formatMoney(value: number) {
  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(value || 0) + " ₫"
  );
}

export default function ReferralPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invitedCount, setInvitedCount] = useState(0);
  const [referralCommission, setReferralCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadReferral() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          router.replace(
            `/login?next=${encodeURIComponent("/referral")}`
          );
          return;
        }

        const [profileResult, statsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("referral_code")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.rpc("get_my_referral_stats"),
        ]);

        if (!mounted) return;

        if (!profileResult.error) {
          setProfile(
            (profileResult.data as Profile | null) ?? null
          );
        }

        if (!statsResult.error) {
          const stats = statsResult.data as {
            invited_count?: number | string;
            net_referral_commission?: number | string;
          } | null;

          setInvitedCount(
            Number(stats?.invited_count ?? 0)
          );
          setReferralCommission(
            Number(
              stats?.net_referral_commission ?? 0
            )
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReferral();

    return () => {
      mounted = false;
    };
  }, [router]);

  const referralLink = useMemo(() => {
    const code = profile?.referral_code?.trim();

    if (!code) return "";

    if (typeof window === "undefined") {
      return `/register?ref=${encodeURIComponent(code)}`;
    }

    return `${window.location.origin}/register?ref=${encodeURIComponent(
      code
    )}`;
  }, [profile?.referral_code]);

  async function copyReferral(
    value: string,
    label: string
  ) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} đã được sao chép`);

      window.setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch {
      setMessage("Không thể sao chép");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] px-4 py-10">
        <div className="mx-auto h-[470px] max-w-4xl animate-pulse rounded-[28px] bg-gray-200" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <span aria-hidden="true">←</span>
            Trở về trang chủ
          </Link>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {/* CHỈ HIỂN THỊ GIAO DIỆN MỜI BẠN BÈ */}
        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-100 bg-emerald-50/70 p-6 sm:px-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white">
                🎁
              </div>

              <div>
                <h1 className="text-lg font-black text-gray-950">
                  Mời bạn bè
                </h1>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Chia sẻ mã hoặc link giới thiệu. Khi người
                  được bạn mời phát sinh đơn đủ điều kiện, hoa
                  hồng giới thiệu sẽ được ghi nhận vào ví.
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
                  referralLink || "Chưa có link"
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

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs leading-5 text-amber-700">
              Hoa hồng chỉ được tính khi đơn hàng của
              người được mời đạt trạng thái đủ điều kiện.
              Nếu đơn bị từ chối sau khi đã ghi nhận, hệ
              thống có thể tạo giao dịch hoàn tác tương
              ứng.
            </div>
          </div>
        </section>
      </div>
    </main>
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
        <div className="min-w-0 flex-1 break-all font-mono text-xs font-black text-gray-950">
          {value}
        </div>

        <button
          type="button"
          disabled={!onCopy}
          onClick={onCopy}
          className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          Sao chép
        </button>
      </div>
    </div>
  );
}
