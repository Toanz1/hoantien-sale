"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [hasSession, setHasSession] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

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

  const passwordValid =
    PASSWORD_REGEX.test(password);

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword;

  useEffect(() => {
    const supabase =
      createClient();

    let mounted = true;

    async function checkSession() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setHasSession(
        Boolean(user)
      );

      setCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) {
            return;
          }

          setHasSession(
            Boolean(session?.user)
          );

          setCheckingSession(false);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleReset(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    if (!passwordValid) {
      setError(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ và 1 số."
      );

      return;
    }

    if (!passwordsMatch) {
      setError(
        "Xác nhận mật khẩu không khớp."
      );

      return;
    }

    if (!hasSession) {
      setError(
        "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu email mới."
      );

      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser(
          {
            password,
          }
        );

      if (updateError) {
        console.error(
          "Update password error:",
          updateError
        );

        setError(
          "Không thể cập nhật mật khẩu. Liên kết có thể đã hết hạn, vui lòng thử gửi yêu cầu mới."
        );

        return;
      }

      setSuccess(
        "Đổi mật khẩu thành công. Đang chuyển đến trang đăng nhập..."
      );

      /*
       * Đăng xuất recovery session.
       * Người dùng đăng nhập lại bằng
       * mật khẩu mới.
       */
      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error(
        "Reset password error:",
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
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-4 sm:px-6">
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
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 md:py-16">
        <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
              🔑
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              Đặt mật khẩu mới
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Tạo mật khẩu mới cho
              tài khoản của bạn.
            </p>
          </div>

          <form
            onSubmit={handleReset}
            className="p-6 sm:p-8"
          >
            {checkingSession ? (
              <div className="flex items-center justify-center gap-3 py-10 text-sm font-bold text-gray-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-500" />

                Đang xác thực liên kết...
              </div>
            ) : !hasSession ? (
              <div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                  Liên kết đặt lại mật
                  khẩu không hợp lệ hoặc
                  đã hết hạn.
                </div>

                <Link
                  href="/forgot-password"
                  className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white hover:bg-emerald-600"
                >
                  Gửi lại email
                </Link>
              </div>
            ) : (
              <>
                <PasswordInput
                  label="Mật khẩu mới"
                  value={password}
                  onChange={
                    setPassword
                  }
                  show={
                    showPassword
                  }
                  onToggle={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  disabled={loading}
                />

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
                        (value) =>
                          !value
                      )
                    }
                    disabled={loading}
                  />
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <div className="text-xs font-black text-gray-700">
                    Mật khẩu phải có
                  </div>

                  <Rule
                    valid={
                      hasMinLength
                    }
                  >
                    Ít nhất 8 ký tự
                  </Rule>

                  <Rule
                    valid={
                      hasLetter
                    }
                  >
                    Ít nhất 1 chữ
                  </Rule>

                  <Rule
                    valid={
                      hasNumber
                    }
                  >
                    Ít nhất 1 số
                  </Rule>

                  <Rule
                    valid={
                      passwordsMatch
                    }
                  >
                    Xác nhận mật khẩu
                    trùng khớp
                  </Rule>
                </div>

                {error && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !passwordValid ||
                    !passwordsMatch
                  }
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Đang cập nhật..."
                    : "Đặt mật khẩu mới"}
                </button>
              </>
            )}
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
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  show: boolean;
  onToggle: () => void;
  disabled: boolean;
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
          placeholder="Ít nhất 8 ký tự"
          autoComplete="new-password"
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-20 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          required
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute inset-y-0 right-3 my-auto h-9 rounded-xl px-3 text-xs font-black text-gray-500 hover:bg-gray-100"
        >
          {show
            ? "Ẩn"
            : "Hiện"}
        </button>
      </div>
    </div>
  );
}

function Rule({
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