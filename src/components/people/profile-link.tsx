// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { usePersonProfileHref } from "@/hooks/use-person-profile-href";

/** "Profili gör": opens the person's full profile page in the current frame (admin or coordinator). */
export function ProfileLink({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const t = useTranslations("personSummary");
  const profileHref = usePersonProfileHref();
  return (
    <Link
      href={profileHref(userId)}
      aria-label={t("openFor", { name })}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 py-2 text-[12.5px] leading-[1.3] font-medium text-[#22262b] hover:bg-[#f5f6f8]"
    >
      {t("open")}
    </Link>
  );
}
