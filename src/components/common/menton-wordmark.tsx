import { useTranslations } from "next-intl";
import Link from "next/link";

/** The gray "menton" wordmark every workspace header uses. */
export function MentonWordmark({ href = "/" }: { href?: string }) {
  const t = useTranslations("sharedUi");
  return (
    <Link
      href={href}
      aria-label={t("homeLabel")}
      className="shrink-0 text-[28px] font-bold leading-[1.3] tracking-[-0.84px] text-[#898989] sm:text-[32px] sm:tracking-[-0.96px]"
    >
      menton
    </Link>
  );
}
