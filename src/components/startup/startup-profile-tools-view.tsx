"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { StartupProfileSection } from "@/components/profile/startup-profile-section";
import { StartupProfileImport } from "@/components/startup/startup-profile-import";

export function StartupProfileToolsView() {
  const t = useTranslations("profileTools");
  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <header className="space-y-3">
        <div className="flex flex-wrap justify-between gap-3 text-sm text-[#c95c18]">
          <Link href="/startup">{t("back")}</Link>
          <Link href="/profile/personal">{t("personal")}</Link>
        </div>
        <h1 className="text-[28px] font-semibold text-[#22262b]">
          {t("title")}
        </h1>
      </header>
      <StartupProfileSection />
      <StartupProfileImport />
    </div>
  );
}
