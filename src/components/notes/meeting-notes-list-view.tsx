"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { AppShell } from "@/components/hoc/app-shell";
import { StartupMeetingsView } from "@/components/startup/startup-meetings-view";
import { AppArea } from "@/types/app-area";

export function MeetingNotesListView() {
  const t = useTranslations("notes");
  return (
    <AppShell active={AppArea.Notes} menteeHome>
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-14 pt-3 sm:px-8">
        <nav
          aria-label={t("breadcrumb")}
          className="mb-5 flex items-center gap-1.5 text-sm text-[#858c96]"
        >
          <Link href="/dashboard" className="hover:text-[#e86f22]">
            {t("home")}
          </Link>
          <span aria-hidden>›</span>
          <span className="text-[#22262b]">{t("title")}</span>
        </nav>
        <StartupMeetingsView hideNotesChip />
      </div>
    </AppShell>
  );
}
