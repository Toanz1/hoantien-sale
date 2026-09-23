"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AdminState =
  | "checking"
  | "allowed"
  | "denied";

export default function AdminGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [state, setState] =
    useState<AdminState>("checking");

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      try {
        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session?.access_token) {
          router.replace(
            `/login?next=${encodeURIComponent(
              "/admin"
            )}`
          );

          return;
        }

        const response = await fetch(
          "/api/admin/me",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        );

        if (!active) return;

        if (response.ok) {
          setState("allowed");
          return;
        }

        setState("denied");
      } catch (error) {
        console.error(
          "Admin permission check error:",
          error
        );

        if (active) {
          setState("denied");
        }
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  if (state === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500" />

          <div className="mt-4 text-sm font-bold text-gray-500">
            Đang kiểm tra quyền quản trị...
          </div>
        </div>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-black text-gray-900">
            Không có quyền truy cập
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Tài khoản này không có quyền truy cập
            khu vực quản trị.
          </p>

          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-6 h-12 w-full rounded-2xl bg-gray-950 text-sm font-black text-white transition hover:bg-gray-800"
          >
            Về trang chính
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}