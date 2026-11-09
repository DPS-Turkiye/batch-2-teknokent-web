"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { PageHeading, StatusChip } from "@/components/admin/admin-ui";

const PEER_MENTORING_HREF = "/student/peer-mentoring";

/**
 * Office Hours is not in Menton yet: academicians' hours are booked through Moodle today. The
 * page says so plainly instead of showing sample slots.
 */
export function StudentOfficeHoursView() {
  const t = useTranslations("odtuWorkspaces.student.officeHours");
  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <section
        aria-labelledby="office-hours-soon"
        className="rounded-[20px] border border-[#e4e7ea] bg-white p-6 sm:p-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff1e8] text-[#e86f22]">
            <CalendarClock aria-hidden className="size-6" />
          </span>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="office-hours-soon"
                className="text-[17px] font-semibold text-[#22262b]"
              >
                {t("soonTitle")}
              </h2>
              <StatusChip tone="neutral">{t("soon")}</StatusChip>
            </div>
            <p className="max-w-2xl text-[13.5px] leading-[21px] text-[#4a5059]">
              {t("soonBody")}
            </p>
            <ul className="max-w-2xl list-disc space-y-1 pl-5 text-[13px] leading-[20px] text-[#676e78]">
              <li>{t("today")}</li>
              <li>{t("later")}</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-3 rounded-[20px] border border-dashed border-[#d6dade] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            {t("meanwhileTitle")}
          </h2>
          <p className="mt-1 text-[13px] text-[#676e78]">
            {t("meanwhileBody")}
          </p>
        </div>
        <Link
          href={PEER_MENTORING_HREF}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white"
        >
          {t("meanwhileAction")}
        </Link>
      </section>
    </div>
  );
}
