"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function HomeAuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function checkAdmin(accessToken?: string | null) {
      if (!accessToken) {
        if (mounted) setIsAdmin(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (!mounted) return;
        setIsAdmin(response.ok);
      } catch (error) {
        console.error("Không thể kiểm tra quyền quản trị:", error);
        if (mounted) setIsAdmin(false);
      }
    }

    async function loadProfile(userId: string) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Không thể tải thông tin người dùng:", error);
      }

      setFullName(profile?.full_name?.trim() || null);
    }

    async function loadUser() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !user) {
          setEmail(null);
          setFullName(null);
          setIsAdmin(false);
          return;
        }

        setEmail(user.email ?? null);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        await Promise.all([
          loadProfile(user.id),
          checkAdmin(session?.access_token ?? null),
        ]);
      } catch (error) {
        console.error("Không thể tải tài khoản:", error);

        if (mounted) {
          setEmail(null);
          setFullName(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const user = session?.user;

      if (!user) {
        setEmail(null);
        setFullName(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      try {
        await Promise.all([
          loadProfile(user.id),
          checkAdmin(session.access_token),
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden h-10 w-28 animate-pulse rounded-xl bg-gray-100 md:block" />
        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
        <div className="hidden h-10 w-28 animate-pulse rounded-xl bg-gray-100 sm:block" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 sm:px-4 sm:text-sm"
        >
          Đăng nhập
        </Link>

        <Link
          href="/register"
          className="rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600 sm:px-4 sm:text-sm"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const displayName = fullName || email.split("@")[0] || "Tài khoản";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-2">
      {/* ADMIN */}
      {isAdmin && (
        <Link
          href="/admin"
          className="hidden h-10 items-center gap-2 rounded-xl bg-gray-950 px-4 text-xs font-black text-white transition hover:bg-gray-800 md:inline-flex"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path
              d="M12 3 4.5 6v5.5c0 4.7 3.2 7.9 7.5 9.5 4.3-1.6 7.5-4.8 7.5-9.5V6L12 3Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m9.5 12 1.7 1.7 3.6-3.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Quản trị
        </Link>
      )}

      {/* INVITE FRIENDS - nằm ngay cạnh chuông */}
      <Link
        href="/referral"
        className="hidden h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 sm:inline-flex"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          className="h-4 w-4"
        >
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="7" r="4" />
          <path
            d="M19 8v6M22 11h-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Mời bạn bè
      </Link>

      {/* NOTIFICATION */}
      <Link
        href="/profile"
        aria-label="Thông báo"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10 21h4" strokeLinecap="round" />
        </svg>
      </Link>

      {/* USER */}
      <Link
        href="/profile"
        className="group flex min-w-0 items-center gap-2 rounded-2xl bg-gray-50 p-1.5 pr-2 transition hover:bg-emerald-50 sm:gap-3 sm:pr-4"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white shadow-sm shadow-emerald-200">
          {avatarLetter}
        </div>

        <div className="hidden min-w-0 sm:block">
          <div className="flex items-center gap-1.5">
            <div className="max-w-[150px] truncate text-sm font-black text-gray-800 transition group-hover:text-emerald-700">
              {displayName}
            </div>

            {isAdmin && (
              <span
                title="Quản trị viên"
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-950 text-[9px] font-black text-white"
              >
                A
              </span>
            )}
          </div>

          <div className="mt-0.5 text-[10px] font-semibold text-gray-400">
            {isAdmin ? "Quản trị viên" : "Tài khoản của tôi"}
          </div>
        </div>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="hidden h-4 w-4 shrink-0 text-gray-300 sm:block"
        >
          <path
            d="m9 18 6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}
