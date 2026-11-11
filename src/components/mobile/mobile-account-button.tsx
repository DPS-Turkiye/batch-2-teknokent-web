"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { useSession } from "@/components/providers/session-provider";
import { MOBILE_ACCOUNT } from "@/lib/mobile";
import { accountAvatarClass } from "@/lib/mobile-account";
import { initials } from "@/lib/utils";

export function MobileAccountButton() {
  const t = useTranslations("mobile.shell");
  const { session } = useSession();
  return (
    <Link
      href={MOBILE_ACCOUNT}
      aria-label={t("account")}
      className={`flex size-11 items-center justify-center rounded-full text-sm leading-[1.35] font-semibold ${accountAvatarClass(session?.role)}`}
    >
      {initials(session?.fullName ?? "")}
    </Link>
  );
}
