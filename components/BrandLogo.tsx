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
      className="flex min-w-0 shrink-0 items-center"
      aria-label="Hoàn Tiền Sale"
    >
      <img
        src="/platforms/hoantiensale.png"
        alt="Hoàn Tiền Sale"
        className={
          compact
            ? "h-10 w-auto max-w-[180px] object-contain sm:h-11"
            : "h-11 w-auto max-w-[220px] object-contain sm:h-12"
        }
      />
    </Link>
  );
}