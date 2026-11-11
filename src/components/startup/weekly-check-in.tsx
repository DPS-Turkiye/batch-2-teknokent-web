// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useWeeklyCheckIn } from "@/hooks/use-weekly-check-in";
import { AttendanceState } from "@/interfaces/program-attendance";
import { formatDateTime } from "@/lib/utils";

const CLOSED_MESSAGE = {
  [AttendanceState.NotStarted]: "notStarted",
  [AttendanceState.Ended]: "ended",
  [AttendanceState.Unscheduled]: "unscheduled",
} as const;

/** Süreç: the participant checks in for the program week running today. */
export function WeeklyCheckIn() {
  const t = useTranslations("weeklyCheckIn");
  const locale = useLocale();
  const { status, visible, weekRange, canCheckIn, isCheckingIn, checkIn } =
    useWeeklyCheckIn();
  if (!visible || !status) return null;

  return (
    <section
      aria-labelledby="weekly-check-in-title"
      className="space-y-3 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5 lg:min-w-[280px]"
    >
      <div>
        <h2
          id="weekly-check-in-title"
          className="text-[15px] font-semibold text-[#22262b]"
        >
          {t("title")}
        </h2>
        {status.week != null ? (
          <p className="mt-0.5 text-[12.5px] text-[#858c96]">
            {[
              status.totalWeeks
                ? t("weekOf", { week: status.week, total: status.totalWeeks })
                : t("week", { week: status.week }),
              weekRange,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </div>

      {status.state === AttendanceState.CheckedIn ? (
        <p className="flex items-center gap-2 text-[13.5px] text-[#1f7a4d]">
          <Check aria-hidden className="size-4" />
          {status.checkedInAt
            ? t("checkedInAt", {
                time: formatDateTime(status.checkedInAt, locale),
              })
            : t("checkedIn")}
        </p>
      ) : status.state === AttendanceState.Open ? (
        <>
          <p className="text-[13px] text-[#676e78]">{t("hint")}</p>
          <button
            type="button"
            onClick={checkIn}
            disabled={!canCheckIn}
            className="h-9 rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {isCheckingIn ? t("saving") : t("action")}
          </button>
        </>
      ) : status.state in CLOSED_MESSAGE ? (
        <p className="text-[13px] text-[#858c96]">
          {t(CLOSED_MESSAGE[status.state as keyof typeof CLOSED_MESSAGE])}
        </p>
      ) : null}
    </section>
  );
}
