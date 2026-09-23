"use client";

import {
  FormEvent,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function getReferralCode() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(
    window.location.search
  );

  return (
    params
      .get("ref")
      ?.trim()
      .toUpperCase() ?? ""
  );
}

function buildAuthCallbackUrl(
  next: string,
  referralCode: string
) {
  const params = new URLSearchParams();

  params.set("next", next);

  if (referralCode) {
    params.set("ref", referralCode);
  }

  return `${
    window.location.origin
  }/auth/callback?${params.toString()}`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [fullName, setFullName] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const hasMinLength =
    password.length >= 8;

  const hasLetter =
    /[A-Za-z]/.test(password);

  const hasNumber =
    /\d/.test(password);

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword;

  const passwordValid =
    PASSWORD_REGEX.test(password);

  async function applyReferral(
    referralCode: string
  ) {
    if (!referralCode) {
      return true;
    }

    const supabase = createClient();

    const { error: referralError } =
      await supabase.rpc(
        "apply_referral_code",
        {
          p_referral_code:
            referralCode,
        }
      );

    if (referralError) {
      console.error(
        "Apply referral error:",
        referralError
      );

      return false;
    }

    return true;
  }

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || googleLoading) {
      return;
    }

    setError("");
    setSuccess("");

    const cleanName =
      fullName.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const referralCode =
      getReferralCode();

    if (!cleanName) {
      setError(
        "Vui lòng nhập họ và tên."
      );
      return;
    }

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

    if (!hasMinLength) {
      setError(
        "Mật khẩu phải có ít nhất 8 ký tự."
      );
      return;
    }

    if (!hasLetter) {
      setError(
        "Mật khẩu phải có ít nhất 1 chữ."
      );
      return;
    }

    if (!hasNumber) {
      setError(
        "Mật khẩu phải có ít nhất 1 số."
      );
      return;
    }

    if (!passwordValid) {
      setError(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ và 1 số."
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Vui lòng nhập lại mật khẩu."
      );
      return;
    }

    if (!passwordsMatch) {
      setError(
        "Xác nhận mật khẩu không khớp."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const callbackUrl =
        buildAuthCallbackUrl(
          "/",
          referralCode
        );

      const {
        data,
        error: signUpError,
      } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo:
              callbackUrl,

            data: {
              full_name:
                cleanName,

              ...(referralCode
                ? {
                    referral_code_pending:
                      referralCode,
                  }
                : {}),
            },
          },
        });

      if (signUpError) {
        console.error(
          "Register error:",
          signUpError
        );

        const message =
          signUpError.message
            .toLowerCase();

        if (
          message.includes(
            "already registered"
          ) ||
          message.includes(
            "already exists"
          )
        ) {
          setError(
            "Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác."
          );
        } else if (
          message.includes(
            "password"
          )
        ) {
          setError(
            "Mật khẩu không hợp lệ. Vui lòng kiểm tra lại."
          );
        } else if (
          message.includes(
            "email"
          )
        ) {
          setError(
            "Email không hợp lệ hoặc không thể sử dụng."
          );
        } else {
          setError(
            "Không thể tạo tài khoản. Vui lòng thử lại."
          );
        }

        return;
      }

      /*
       * Nếu Supabase trả session ngay,
       * tức là không cần chờ confirm email.
       * Lúc này có thể áp referral ngay.
       */
      if (data.session) {
        const referralApplied =
          await applyReferral(
            referralCode
          );

        if (
          referralCode &&
          !referralApplied
        ) {
          console.warn(
            "Tài khoản đã được tạo nhưng chưa thể áp dụng mã giới thiệu."
          );
        }

        router.replace("/");
        router.refresh();

        return;
      }

      /*
       * Nếu chưa có session:
       * Supabase đang yêu cầu xác nhận email.
       * callback URL đã mang ref theo.
       */
      setPassword("");
      setConfirmPassword("");

      setSuccess(
        referralCode
          ? "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản. Mã giới thiệu sẽ được ghi nhận sau khi xác nhận."
          : "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản nếu được yêu cầu."
      );
    } catch (err) {
      console.error(
        "Register error:",
        err
      );

      setError(
        "Có lỗi kết nối đến hệ thống. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    if (loading || googleLoading) {
      return;
    }

    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      const supabase =
        createClient();

      const referralCode =
        getReferralCode();

      const redirectTo =
        buildAuthCallbackUrl(
          "/",
          referralCode
        );

      const {
        error: googleError,
      } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
          },
        });

      if (googleError) {
        console.error(
          "Google register error:",
          googleError
        );

        setError(
          "Không thể đăng ký bằng Google. Vui lòng thử lại."
        );

        setGoogleLoading(false);
      }
    } catch (err) {
      console.error(
        "Google register error:",
        err
      );

      setError(
        "Không thể kết nối với Google. Vui lòng thử lại."
      );

      setGoogleLoading(false);
    }
  }

  const busy =
    loading || googleLoading;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <header className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white shadow-sm shadow-emerald-200">
              H
            </div>

            <div>
              <div className="text-base font-black tracking-tight sm:text-lg">
                Hoàn Tiền Sale
              </div>

              <div className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:block">
                Mua sắm · Nhận tiền
              </div>
            </div>
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 md:py-14">
        <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
              👤
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              Tạo tài khoản
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Đăng ký để bắt đầu mua
              sắm và nhận hoàn tiền.
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="p-6 sm:p-8"
          >
            <div>
              <label className="mb-2 block text-sm font-black text-gray-700">
                Họ và tên
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                disabled={busy}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                required
              />
            </div>

            <div className="mt-5">
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
                disabled={busy}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                required
              />
            </div>

            <div className="mt-5">
              <PasswordInput
                label="Mật khẩu"
                value={password}
                onChange={
                  setPassword
                }
                show={
                  showPassword
                }
                onToggle={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                disabled={busy}
                placeholder="Ít nhất 8 ký tự"
              />
            </div>

            <div className="mt-5">
              <PasswordInput
                label="Xác nhận mật khẩu"
                value={
                  confirmPassword
                }
                onChange={
                  setConfirmPassword
                }
                show={
                  showConfirmPassword
                }
                onToggle={() =>
                  setShowConfirmPassword(
                    (current) =>
                      !current
                  )
                }
                disabled={busy}
                placeholder="Nhập lại mật khẩu"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-black text-gray-700">
                Mật khẩu phải có
              </div>

              <PasswordRule
                valid={hasMinLength}
              >
                Ít nhất 8 ký tự
              </PasswordRule>

              <PasswordRule
                valid={hasLetter}
              >
                Ít nhất 1 chữ
              </PasswordRule>

              <PasswordRule
                valid={hasNumber}
              >
                Ít nhất 1 số
              </PasswordRule>

              <PasswordRule
                valid={
                  passwordsMatch
                }
              >
                Xác nhận mật khẩu
                trùng khớp
              </PasswordRule>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black">
                  !
                </div>

                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black">
                  ✓
                </div>

                <div>
                  {success}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                busy ||
                !fullName.trim() ||
                !email.trim() ||
                !passwordValid ||
                !passwordsMatch
              }
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {loading
                ? "Đang tạo tài khoản..."
                : "Đăng ký"}
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
                handleGoogleRegister
              }
              disabled={busy}
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
              Đã có tài khoản?{" "}

              <Link
                href="/login"
                className="font-black text-emerald-600 transition hover:text-emerald-700"
              >
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  show: boolean;
  onToggle: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            show
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          autoComplete="new-password"
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-20 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
          required
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute inset-y-0 right-3 my-auto h-9 rounded-xl px-3 text-xs font-black text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
        >
          {show
            ? "Ẩn"
            : "Hiện"}
        </button>
      </div>
    </div>
  );
}

function PasswordRule({
  valid,
  children,
}: {
  valid: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100 text-emerald-600"
            : "bg-gray-200 text-gray-400"
        }`}
      >
        ✓
      </span>

      <span
        className={
          valid
            ? "text-emerald-700"
            : "text-gray-500"
        }
      >
        {children}
      </span>
    </div>
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