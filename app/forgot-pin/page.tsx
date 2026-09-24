"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPinPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setEmail(user.email || "");
    })();
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(""); setSuccess("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) { setError("Vui lòng nhập email."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login?next=/forgot-pin"); return; }
      if ((user.email || "").toLowerCase() !== cleanEmail) {
        setError("Email phải trùng với email của tài khoản đang đăng nhập.");
        return;
      }
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-pin`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (resetError) {
        console.error("Send PIN recovery email error:", resetError);
        setError("Không thể gửi email xác minh. Vui lòng thử lại sau.");
        return;
      }
      setSuccess("Đã gửi liên kết xác minh. Hãy mở email và bấm vào liên kết để đặt mã PIN rút tiền mới.");
    } catch (err) {
      console.error("Forgot PIN error:", err);
      setError("Có lỗi kết nối đến hệ thống. Vui lòng thử lại.");
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
    <header className="border-b border-gray-200/80 bg-white"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white">H</div><div><div className="font-black">Hoàn Tiền Sale</div><div className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:block">Mua sắm · Nhận tiền</div></div></Link>
      <Link href="/profile" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">← Trang cá nhân</Link>
    </div></header>
    <div className="mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 md:py-16"><div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-7 sm:px-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">🔐</div><h1 className="mt-5 text-2xl font-black sm:text-3xl">Quên mã PIN?</h1><p className="mt-2 text-sm leading-6 text-gray-500">Xác minh lại email tài khoản trước khi đặt mã PIN rút tiền mới.</p></div>
      <form onSubmit={handleSubmit} className="p-6 sm:p-8"><label className="mb-2 block text-sm font-black text-gray-700">Email tài khoản</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" disabled={loading} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100" required />
      {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{success && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">{success}</div>}
      <button type="submit" disabled={loading || !email.trim()} className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-50">{loading ? "Đang gửi..." : "Gửi email xác minh"}</button>
      <div className="mt-6 text-center"><Link href="/profile" className="text-sm font-black text-emerald-600">← Quay lại trang cá nhân</Link></div></form>
    </div></div>
  </main>;
}
