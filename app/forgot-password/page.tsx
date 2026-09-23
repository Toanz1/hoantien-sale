"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Vui lòng nhập email."
      );

      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const origin =
        window.location.origin;

      const redirectTo =
        `${origin}/auth/callback?next=/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo,
          }
        );

      if (resetError) {
        console.error(
          "Reset password error:",
          resetError
        );

        setError(
          "Không thể gửi email khôi phục. Vui lòng thử lại sau."
        );

        return;
      }

      /*
       * Không thông báo email có tồn tại
       * hay không để tránh dò tài khoản.
       */
      setSuccess(
        "Nếu email này có tài khoản, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư và thư rác."
      );
    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      setError(
        "Có lỗi kết nối đến hệ thống. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <header className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white">
              H
            </div>

            <div>
              <div className="text-base font-black sm:text-lg">
                Hoàn Tiền Sale
              </div>

              <div className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:block">
                Mua sắm · Nhận tiền
              </div>
            </div>
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 md:py-16">
        <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
              ✉️
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              Quên mật khẩu?
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Nhập email đã đăng ký.
              Chúng tôi sẽ gửi cho bạn
              liên kết đặt lại mật khẩu.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >
            <label className="mb-2 block text-sm font-black text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="nguyenvana@example.com"
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
              required
            />

            {error && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !email.trim()
              }
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {loading
                ? "Đang gửi..."
                : "Gửi email đặt lại mật khẩu"}
            </button>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-black text-emerald-600 hover:text-emerald-700"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}