"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const normalizePin = (value: string) => value.replace(/\D/g, "").slice(0, 6);

export default function ResetPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !user) { setError("Liên kết xác minh không hợp lệ hoặc đã hết phiên. Vui lòng gửi lại email xác minh."); }
      setChecking(false);
    })();
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(""); setSuccess("");
    if (!/^\d{6}$/.test(pin)) { setError("Mã PIN mới phải gồm đúng 6 chữ số."); return; }
    if (pin !== confirmPin) { setError("Mã PIN xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("reset_withdrawal_pin_after_recovery", { p_new_pin: pin });
      if (rpcError) {
        const message = rpcError.message || "";
        if (message.includes("RECOVERY_VERIFICATION_REQUIRED")) setError("Bạn phải mở trang này từ liên kết xác minh vừa được gửi qua email.");
        else if (message.includes("INVALID_PIN_FORMAT")) setError("Mã PIN phải gồm đúng 6 chữ số.");
        else if (message.includes("UNAUTHORIZED")) setError("Phiên xác minh đã hết hạn. Vui lòng gửi lại email xác minh.");
        else { console.error("Reset withdrawal PIN error:", rpcError); setError("Không thể đặt lại mã PIN. Vui lòng thử lại."); }
        return;
      }
      setPin(""); setConfirmPin("");
      setSuccess("Đã đặt lại mã PIN rút tiền thành công. Đang quay về trang cá nhân...");
      window.setTimeout(() => { router.replace("/profile"); router.refresh(); }, 1200);
    } catch (err) {
      console.error("Reset PIN error:", err);
      setError("Có lỗi kết nối đến hệ thống. Vui lòng thử lại.");
    } finally { setLoading(false); }
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa]"><div className="font-bold text-gray-500">Đang kiểm tra phiên xác minh...</div></main>;

  return <main className="min-h-screen bg-[#f7f8fa] text-gray-900"><header className="border-b border-gray-200/80 bg-white"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/" className="font-black">Hoàn Tiền Sale</Link><Link href="/profile" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold">Trang cá nhân</Link></div></header>
    <div className="mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 md:py-16"><div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 px-6 py-7 sm:px-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">🔑</div><h1 className="mt-5 text-2xl font-black sm:text-3xl">Đặt mã PIN mới</h1><p className="mt-2 text-sm leading-6 text-gray-500">Mã PIN gồm đúng 6 chữ số và sẽ được dùng để xác nhận rút tiền.</p></div>
      <form onSubmit={handleSubmit} className="p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-black">Mã PIN mới</label><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin} onChange={e=>setPin(normalizePin(e.target.value))} placeholder="••••••" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-center font-mono text-xl font-black tracking-[0.5em] outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100" /></div><div><label className="mb-2 block text-sm font-black">Nhập lại PIN</label><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={confirmPin} onChange={e=>setConfirmPin(normalizePin(e.target.value))} placeholder="••••••" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-center font-mono text-xl font-black tracking-[0.5em] outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100" /></div></div>
      {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{success && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}</div>}
      <button type="submit" disabled={loading || pin.length !== 6 || confirmPin.length !== 6} className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-50">{loading ? "Đang lưu..." : "Đặt lại mã PIN"}</button>
      <div className="mt-6 text-center"><Link href="/forgot-pin" className="text-sm font-black text-emerald-600">Gửi lại email xác minh</Link></div></form></div></div>
  </main>;
}
