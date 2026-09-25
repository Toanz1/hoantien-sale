import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-emerald-500 bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {/* LOGO */}
        <div className="flex items-center justify-center gap-3">
          <img
            src="/platforms/hoantiensale.png"
            alt="Hoàn Tiền Sale"
            className="h-12 w-auto object-contain"
          />

          <div>
            <div className="text-lg font-black leading-none">
              <span className="text-white">Hoàn Tiền </span>
              <span className="text-emerald-400">Sale</span>
            </div>

            <p className="mt-1 text-[11px] text-gray-400">
              Mua sắm thông minh • Nhận tiền hoàn
            </p>
          </div>
        </div>

        <p className="mt-2 text-center text-xs font-bold text-emerald-400">
          Mua sắm hoàn tiền Shopee, Lazada, TikTok Shop
        </p>

        {/* MENU */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div>
            <h3 className="text-sm font-black text-emerald-400">
              Săn hoàn tiền
            </h3>

            <div className="mt-3 space-y-2 text-sm text-gray-200">
              <Link
                href="/hoan-tien-shopee"
                className="block transition hover:text-emerald-400"
              >
                Hoàn tiền Shopee
              </Link>

              <Link
                href="/hoan-tien-lazada"
                className="block transition hover:text-emerald-400"
              >
                Hoàn tiền Lazada
              </Link>

              <Link
                href="/hoan-tien-tiktok-shop"
                className="block transition hover:text-emerald-400"
              >
                Hoàn tiền TikTok Shop
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-emerald-400">
              Hỗ trợ
            </h3>

            <div className="mt-3 space-y-2 text-sm text-gray-200">
              <Link
                href="/#how-it-works"
                className="block transition hover:text-emerald-400"
              >
                Hướng dẫn hoàn tiền
              </Link>

              <Link
                href="/orders"
                className="block transition hover:text-emerald-400"
              >
                Theo dõi đơn hàng
              </Link>

              <Link
                href="/wallet"
                className="block transition hover:text-emerald-400"
              >
                Ví & rút tiền
              </Link>

              <Link
                href="/referral"
                className="block transition hover:text-emerald-400"
              >
                Mời bạn bè
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-emerald-400">
              Pháp lý
            </h3>

            <div className="mt-3 space-y-2 text-sm text-gray-200">
              <Link
                href="/terms"
                className="block transition hover:text-emerald-400"
              >
                Điều khoản sử dụng
              </Link>

              <Link
                href="/privacy"
                className="block transition hover:text-emerald-400"
              >
                Chính sách bảo mật
              </Link>

              <Link
                href="/security"
                className="block transition hover:text-emerald-400"
              >
                Bảo mật tài khoản
              </Link>

              <p>
                Liên hệ:{" "}
                <a
                  href="mailto:support@hoantiensale.com"
                  className="font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  support@hoantiensale.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row">
          <p className="text-xs text-gray-400">
            © 2026 Hoàn Tiền Sale
          </p>

          <div className="flex items-center gap-2">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500 text-sm font-black transition hover:bg-emerald-500"
            >
              f
            </a>

            <a
              href="#"
              aria-label="Telegram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500 text-xs transition hover:bg-emerald-500"
            >
              ➤
            </a>

            <a
              href="mailto:support@hoantiensale.com"
              aria-label="Email"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500 text-xs transition hover:bg-emerald-500"
            >
              ✉
            </a>
          </div>

          <p className="text-xs font-black">
            <span className="text-white">Hoàn Tiền </span>
            <span className="text-emerald-400">Sale</span>
          </p>
        </div>
      </div>
    </footer>
  );
}