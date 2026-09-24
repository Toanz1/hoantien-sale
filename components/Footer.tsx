import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t-4 border-emerald-500 bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center"><BrandLogo /></div>
          <p className="mt-3 text-sm font-bold text-emerald-400">
            Mua sắm hoàn tiền Shopee, Lazada, TikTok Shop
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">
          <div>
            <h3 className="text-base font-black text-emerald-400">Săn hoàn tiền</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Link href="/hoan-tien-shopee" className="block transition hover:text-emerald-400">Hoàn tiền Shopee</Link>
              <Link href="/hoan-tien-lazada" className="block transition hover:text-emerald-400">Hoàn tiền Lazada</Link>
              <Link href="/hoan-tien-tiktok-shop" className="block transition hover:text-emerald-400">Hoàn tiền TikTok Shop</Link>
            </div>
          </div>

          <div>
            <h3 className="text-base font-black text-emerald-400">Hỗ trợ</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Link href="/#how-it-works" className="block transition hover:text-emerald-400">Hướng dẫn hoàn tiền</Link>
              <Link href="/orders" className="block transition hover:text-emerald-400">Theo dõi đơn hàng</Link>
              <Link href="/wallet" className="block transition hover:text-emerald-400">Ví & rút tiền</Link>
              <Link href="/referral" className="block transition hover:text-emerald-400">Mời bạn bè</Link>
            </div>
          </div>

          <div>
            <h3 className="text-base font-black text-emerald-400">Pháp lý</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Link href="/terms" className="block transition hover:text-emerald-400">Điều khoản sử dụng</Link>
              <Link href="/privacy" className="block transition hover:text-emerald-400">Chính sách bảo mật</Link>
              <Link href="/security" className="block transition hover:text-emerald-400">Bảo mật tài khoản</Link>
              <p>Liên hệ: <a href="mailto:support@hoantiensale.com" className="font-semibold text-emerald-400 underline underline-offset-2">support@hoantiensale.com</a></p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-7 text-center">
          <p className="text-sm text-gray-400">© 2026 Hoàn Tiền Sale</p>
          <div className="mt-5 flex justify-center gap-3">
            <a href="#" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500 text-lg font-black transition hover:bg-emerald-500">f</a>
            <a href="#" aria-label="Telegram" className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500 transition hover:bg-emerald-500">➤</a>
            <a href="mailto:support@hoantiensale.com" aria-label="Email" className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500 transition hover:bg-emerald-500">✉</a>
          </div>
          <p className="mt-5 text-sm font-black">Hoàn Tiền Sale</p>
        </div>
      </div>
    </footer>
  );
}
