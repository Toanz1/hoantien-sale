"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import HomeAuthNav from "@/components/HomeAuthNav";
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
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (userError || !user) {
          router.replace(`/login?next=${encodeURIComponent("/referral")}`);
          return;
        }

        const [profileResult, referralStatsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("referral_code")
            .eq("id", user.id)
            .maybeSingle(),

          supabase.rpc("get_my_referral_stats"),
        ]);

        if (!active) return;

        if (profileResult.error) {
          console.error("Referral profile error:", profileResult.error);
          setError("Không thể tải mã giới thiệu.");
        } else {
          setProfile((profileResult.data as Profile | null) ?? null);
        }

        if (referralStatsResult.error) {
          console.error(
            "Referral stats error:",
            referralStatsResult.error
          );
          setInvitedCount(0);
          setReferralCommission(0);
        } else {
          const stats = referralStatsResult.data as {
            invited_count?: number | string;
            net_referral_commission?: number | string;
          } | null;

          setInvitedCount(Number(stats?.invited_count ?? 0));
          setReferralCommission(
            Number(stats?.net_referral_commission ?? 0)
          );
        }
      } catch (err) {
        console.error("Load referral error:", err);

        if (active) {
          setError("Không thể tải thông tin giới thiệu.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
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

  async function copyReferral(value: string, label: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setError("");
      setSuccess(`${label} đã được sao chép.`);

      window.setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Copy referral error:", err);
      setSuccess("");
      setError("Không thể sao chép. Vui lòng thử lại.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      {/* HEADER giống Trang chủ */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <BrandLogo />

          <div className="hidden whitespace-nowrap text-sm font-bold text-gray-700 md:block">
            
          </div>

          <div className="flex justify-end">
            <HomeAuthNav />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-emerald-600"
          >
            ← Trang chủ
          </Link>
        </div>

        {loading ? (
          <div className="h-[480px] animate-pulse rounded-[28px] bg-gray-200" />
        ) : (
          <>
            {success && (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                ✓ {success}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            {/* GIAO DIỆN MỜI BẠN BÈ GIỐNG PHẦN TRONG PROFILE */}
            <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
              <div className="border-b border-emerald-100 bg-emerald-50/60 p-6 sm:px-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white">
                    🎁
                  </div>

                  <div>
                    <h1 className="text-lg font-black text-gray-950">
                      Mời bạn bè
                    </h1>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Chia sẻ mã hoặc link giới thiệu. Khi người được
                      bạn mời phát sinh đơn đủ điều kiện, hoa hồng giới
                      thiệu sẽ được ghi nhận vào ví.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReferralValue
                    label="Mã giới thiệu"
                    value={profile?.referral_code || "Chưa có mã"}
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
                    value={referralLink || "Chưa có link"}
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
                      {formatMoney(referralCommission)}
                    </div>

                    <div className="mt-1 text-xs text-emerald-600">
                      Hoa hồng ròng đã ghi nhận
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs leading-5 text-amber-700">
                  Hoa hồng chỉ được tính khi đơn hàng của người được
                  mời đạt trạng thái đủ điều kiện. Nếu đơn bị từ chối
                  sau khi đã ghi nhận, hệ thống có thể tạo giao dịch
                  hoàn tác tương ứng.
                </div>
              </div>
            </div>
          </>
        )}
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
          onClick={onCopy}
          disabled={!onCopy}
          className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          Sao chép
        </button>
      </div>
    </div>
  );
}
