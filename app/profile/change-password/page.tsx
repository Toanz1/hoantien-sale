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

export default function ChangePasswordPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const supabase =
          createClient();

        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (authError || !user) {
          router.replace(
            `/login?next=${encodeURIComponent(
              "/profile/change-password"
            )}`
          );

          return;
        }

        setEmail(
          user.email || ""
        );
      } catch (err) {
        console.error(
          "Load change password user error:",
          err
        );

        if (active) {
          setError(
            "Không thể tải thông tin tài khoản."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError(
        "Vui lòng nhập mật khẩu hiện tại."
      );

      return;
    }

    if (!newPassword) {
      setError(
        "Vui lòng nhập mật khẩu mới."
      );

      return;
    }

    if (
      !PASSWORD_REGEX.test(
        newPassword
      )
    ) {
      setError(
        "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ và 1 số."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Xác nhận mật khẩu mới không khớp."
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setError(
        "Mật khẩu mới phải khác mật khẩu hiện tại."
      );

      return;
    }

    if (!email) {
      setError(
        "Không xác định được email tài khoản."
      );

      return;
    }

    setSaving(true);

    try {
      const supabase =
        createClient();

      /*
       * BƯỚC 1:
       * Xác thực lại mật khẩu hiện tại.
       */
      const {
        error: verifyError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password:
              currentPassword,
          }
        );

      if (verifyError) {
        setError(
          "Mật khẩu hiện tại không chính xác."
        );

        return;
      }

      /*
       * BƯỚC 2:
       * Đổi sang mật khẩu mới.
       */
      const {
        error: updateError,
      } =
        await supabase.auth.updateUser(
          {
            password:
              newPassword,
          }
        );

      if (updateError) {
        console.error(
          "Change password error:",
          updateError
        );

        setError(
          "Không thể cập nhật mật khẩu. Vui lòng thử lại."
        );

        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(
        false
      );

      setShowNewPassword(
        false
      );

      setShowConfirmPassword(
        false
      );

      setSuccess(
        "Mật khẩu đã được thay đổi thành công."
      );
    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setError(
        "Có lỗi kết nối đến hệ thống. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  }

  const hasMinLength =
    newPassword.length >= 8;

  const hasLetter =
    /[A-Za-z]/.test(
      newPassword
    );

  const hasNumber =
    /\d/.test(
      newPassword
    );

  const passwordsMatch =
    newPassword.length > 0 &&
    newPassword ===
      confirmPassword;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa]">
        <Header />

        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="h-[620px] animate-pulse rounded-[28px] bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <Header />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 md:py-12">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-900"
        >
          <span>←</span>

          Quay lại trang cá nhân
        </Link>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          {/* TITLE */}
          <div className="border-b border-gray-100 px-6 py-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
              🔒
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              Đổi mật khẩu
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Xác nhận mật khẩu hiện tại
              trước khi tạo mật khẩu mới.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-black text-gray-700">
                Email đăng nhập
              </label>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold text-gray-500">
                {email || "—"}
              </div>
            </div>

            {/* ERROR */}
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

            {/* SUCCESS */}
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

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6"
            >
              {/* CURRENT PASSWORD */}
              <PasswordField
                label="Mật khẩu hiện tại"
                value={
                  currentPassword
                }
                onChange={
                  setCurrentPassword
                }
                show={
                  showCurrentPassword
                }
                onToggle={() =>
                  setShowCurrentPassword(
                    (current) =>
                      !current
                  )
                }
                disabled={saving}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu hiện tại"
              />

              <div className="my-6 border-t border-gray-100" />

              {/* NEW PASSWORD */}
              <PasswordField
                label="Mật khẩu mới"
                value={
                  newPassword
                }
                onChange={
                  setNewPassword
                }
                show={
                  showNewPassword
                }
                onToggle={() =>
                  setShowNewPassword(
                    (current) =>
                      !current
                  )
                }
                disabled={saving}
                autoComplete="new-password"
                placeholder="Nhập mật khẩu mới"
              />

              {/* CONFIRM */}
              <div className="mt-5">
                <PasswordField
                  label="Xác nhận mật khẩu mới"
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
                  disabled={saving}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              {/* PASSWORD RULES */}
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-black text-gray-700">
                  Mật khẩu mới phải có
                </div>

                <PasswordRule
                  valid={
                    hasMinLength
                  }
                >
                  Ít nhất 8 ký tự
                </PasswordRule>

                <PasswordRule
                  valid={
                    hasLetter
                  }
                >
                  Ít nhất 1 chữ
                </PasswordRule>

                <PasswordRule
                  valid={
                    hasNumber
                  }
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

              {/* ACTIONS */}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                <Link
                  href="/profile"
                  className="flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-sm font-black text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </Link>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !currentPassword ||
                    !PASSWORD_REGEX.test(
                      newPassword
                    ) ||
                    !passwordsMatch
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving
                    ? "Đang xác nhận..."
                    : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECURITY */}
        <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              🛡️
            </div>

            <div>
              <div className="text-sm font-black text-amber-900">
                Bảo mật tài khoản
              </div>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                Không chia sẻ mật khẩu
                với người khác và không
                sử dụng lại mật khẩu của
                các tài khoản quan trọng
                khác.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  disabled,
  autoComplete,
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
  autoComplete: string;
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
          disabled={disabled}
          autoComplete={
            autoComplete
          }
          placeholder={
            placeholder
          }
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-20 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
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

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white shadow-sm shadow-emerald-200">
            H
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-black tracking-tight">
              Hoàn Tiền Sale
            </div>

            <div className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:block">
              Mua sắm · Nhận tiền
            </div>
          </div>
        </Link>

        <Link
          href="/profile"
          className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-black text-gray-700 transition hover:bg-gray-200 sm:text-sm"
        >
          Tài khoản
        </Link>
      </div>
    </header>
  );
}