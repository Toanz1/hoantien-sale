import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
};

export default function BrandLogo({
  href = "/",
  compact = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className="flex min-w-0 shrink-0 items-center gap-2.5"
      aria-label="Hoàn Tiền Sale"
    >
      <img
        src="/platforms/hoantiensale.png"
        alt="Hoàn Tiền Sale"
        className={
          compact
            ? "h-10 w-auto object-contain sm:h-11"
            : "h-11 w-auto object-contain sm:h-12"
        }
      />

      <div className="flex flex-col leading-none">
        <span
          className={
            compact
              ? "whitespace-nowrap text-sm font-black tracking-tight text-gray-900"
              : "whitespace-nowrap text-base font-black tracking-tight text-gray-900 sm:text-lg"
          }
        >
          Hoàn Tiền <span className="text-emerald-500">Sale</span>
        </span>

        {!compact && (
          <span className="mt-1 hidden whitespace-nowrap text-[10px] font-semibold text-gray-400 sm:block">
            Mua sắm thông minh • Nhận tiền hoàn
          </span>
        )}
      </div>
    </Link>
  );
}