"use client";

import {
  FormEvent,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function getUrlParams() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const rawNext =
    params.get("next");

  const next =
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//")
      ? rawNext
      : "/";

  const referralCode =
    params
      .get("ref")
      ?.trim()
      .toUpperCase() ?? "";

  return {
    next,
    referralCode,
  };
}

function buildCallbackUrl(
  next: string,
  referralCode: string
) {
  const params =
    new URLSearchParams();

  params.set("next", next);

  if (referralCode) {
    params.set(
      "ref",
      referralCode
    );
  }

  return `${
    window.location.origin
  }/auth/callback?${params.toString()}`;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  async function applyReferral(
    referralCode: string
  ) {
    if (!referralCode) {
      return;
    }

    const supabase =
      createClient();

    const {
      error: referralError,
    } = await supabase.rpc(
      "apply_referral_code",
      {
        p_referral_code:
          referralCode,
      }
    );

    if (referralError) {
      /*
       * Login không được thất bại chỉ vì
       * referral đã được gắn trước đó
       * hoặc mã không còn hợp lệ.
       */
      console.warn(
        "Referral was not applied:",
        referralError.message
      );
    }
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || googleLoading) {
      return;
    }

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Vui lòng nhập email."
      );
      return;
    }

    if (!password) {
      setError(
        "Vui lòng nhập mật khẩu."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const {
        error: loginError,
      } =
        await supabase.auth
          .signInWithPassword({
            email: cleanEmail,
            password,
          });

      if (loginError) {
        console.error(
          "Login error:",
          loginError
        );

        const message =
          loginError.message
            .toLowerCase();

        if (
          message.includes(
            "invalid login credentials"
          )
        ) {
          setError(
            "Email hoặc mật khẩu không chính xác."
          );
        } else if (
          message.includes(
            "email not confirmed"
          )
        ) {
          setError(
            "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn."
          );
        } else {
          setError(
            "Không thể đăng nhập. Vui lòng thử lại."
          );
        }

        return;
      }

      const {
        next,
        referralCode,
      } = getUrlParams();

      await applyReferral(
        referralCode
      );

      router.replace(next);
      router.refresh();
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Có lỗi kết nối đến hệ thống. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (loading || googleLoading) {
      return;
    }

    setError("");
    setGoogleLoading(true);

    try {
      const supabase =
        createClient();

      const {
        next,
        referralCode,
      } = getUrlParams();

      const redirectTo =
        buildCallbackUrl(
          next,
          referralCode
        );

      const {
        error: googleError,
      } =
        await supabase.auth
          .signInWithOAuth({
            provider: "google",
            options: {
              redirectTo,
            },
          });

      if (googleError) {
        console.error(
          "Google login error:",
          googleError
        );

        setError(
          "Không thể đăng nhập bằng Google. Vui lòng thử lại."
        );

        setGoogleLoading(false);
      }
    } catch (err) {
      console.error(
        "Google login error:",
        err
      );

      setError(
        "Không thể kết nối với Google. Vui lòng thử lại."
      );

      setGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <header className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white shadow-sm shadow-emerald-200">
              H
            </div>

            <div className="min-w-0">
              <div className="truncate text-base font-black tracking-tight sm:text-lg">
                Hoàn Tiền Sale
              </div>

              <div className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:block">
                Mua sắm · Nhận tiền
              </div>
            </div>
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            Đăng ký
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 md:py-16">
        <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
              🔐
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              Đăng nhập
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Chào mừng bạn quay trở lại
              Hoàn Tiền Sale.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="p-6 sm:p-8"
          >
            <div>
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
                disabled={
                  loading ||
                  googleLoading
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                required
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-4">
                <label className="text-sm font-black text-gray-700">
                  Mật khẩu
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-black text-emerald-600 transition hover:text-emerald-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-20 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={
                    loading ||
                    googleLoading
                  }
                  className="absolute inset-y-0 right-3 my-auto h-9 rounded-xl px-3 text-xs font-black text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  {showPassword
                    ? "Ẩn"
                    : "Hiện"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black">
                  !
                </div>

                <div>
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                googleLoading ||
                !email.trim() ||
                !password
              }
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {loading
                ? "Đang đăng nhập..."
                : "Đăng nhập"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />

              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Hoặc
              </span>

              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={
                handleGoogleLogin
              }
              disabled={
                loading ||
                googleLoading
              }
              className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {googleLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
                  Đang kết nối Google...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Tiếp tục với Google
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-gray-500">
              Chưa có tài khoản?{" "}

              <Link
                href="/register"
                className="font-black text-emerald-600 transition hover:text-emerald-700"
              >
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  );
}