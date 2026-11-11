import { useTranslations } from "next-intl";
import Link from "next/link";

export function MentorshipsBackLink({ href }: { href: string }) {
  const t = useTranslations("sharedUi");
  return (
    <Link
      href={href}
      className="inline-flex text-sm font-medium text-[var(--ms-accent,#e86f22)] hover:underline"
    >
      ← {t("backToMentorships")}
    </Link>
  );
}
