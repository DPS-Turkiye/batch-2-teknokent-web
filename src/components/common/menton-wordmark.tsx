import Link from "next/link";

/** The gray "menton" wordmark every workspace header uses. */
export function MentonWordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="menton ana sayfa"
      className="shrink-0 text-[28px] font-bold leading-[1.3] tracking-[-0.84px] text-[#898989] sm:text-[32px] sm:tracking-[-0.96px]"
    >
      menton
    </Link>
  );
}
