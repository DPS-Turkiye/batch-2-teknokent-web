// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { MentorshipWorkspaceTab } from "@/types/mentorship";

/** In place of a 404 when a mentor's profile is not open to this viewer. */
export function MentorUnavailable() {
  const t = useTranslations("mentorUnavailable");
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 pb-14 pt-16 text-center sm:px-8">
      <h1 className="text-xl font-medium text-[#22262b]">{t("title")}</h1>
      <p className="mt-3 text-sm leading-5 text-[#676e78]">{t("body")}</p>
      <Link
        href={`/mentorships?tab=${MentorshipWorkspaceTab.MentorPool}`}
        className="mt-6 inline-flex rounded-lg bg-[#e86f22] px-4 py-[11px] text-sm font-medium text-white transition hover:bg-[#ce5e19]"
      >
        {t("back")}
      </Link>
    </div>
  );
}
