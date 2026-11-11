"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { CalendarRange } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useProgramThisWeek } from "@/hooks/use-program-this-week";
import { dayRangeLabel, ProgramWeekCardState } from "@/lib/program-week";
import { formatLongDate } from "@/lib/utils";

const LIST_KEYS = ["topics", "activities", "deliverables"] as const;

/**
 * "Bu hafta" on Süreç: the program week running today with what the coordinator planned for it, read from the
 * syllabus. Shown to the program's participants only; anyone outside a program sees nothing.
 */
export function ProgramWeekCard({ className = "" }: { className?: string }) {
  const t = useTranslations("programThisWeek");
  const locale = useLocale();
  const current = useProgramThisWeek();
  if (current.hidden) return null;

  const frame = `space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5 ${className}`;
  const eyebrow = (
    <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#e86f22]">
      <CalendarRange aria-hidden className="size-4" />
      {t("eyebrow")}
    </p>
  );

  if (current.isLoading) {
    return (
      <section aria-label={t("eyebrow")} className={frame}>
        {eyebrow}
        <p role="status" className="text-[13px] text-[#858c96]">
          {t("loading")}
        </p>
      </section>
    );
  }
  if (current.error || !current.week) {
    return (
      <section aria-label={t("eyebrow")} className={frame}>
        {eyebrow}
        <p role="alert" className="text-[13px] text-[#b42318]">
          {t("loadFailed")}
        </p>
      </section>
    );
  }

  const { week, phase, state } = current;
  const range = dayRangeLabel(week.weekStart, week.weekEnd, locale);
  const meta = [
    week.week ? t("weekNumber", { week: week.week }) : null,
    phase?.name ?? null,
    range,
  ].filter(Boolean);

  return (
    <section aria-labelledby="program-week-title" className={frame}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {eyebrow}
        {week.week && week.totalWeeks ? (
          <span className="rounded-full border border-[#e4e7ea] bg-[#f3f4f6] px-2.5 py-1 text-[11.5px] font-medium text-[#676e78]">
            {t("ofTotal", { week: week.week, total: week.totalWeeks })}
          </span>
        ) : null}
      </div>
      {state === ProgramWeekCardState.Ready ? (
        <>
          <div className="space-y-1">
            <h2
              id="program-week-title"
              className="text-[17px] font-semibold leading-[25px] text-[#22262b]"
            >
              {week.plan?.title ?? phase?.name}
            </h2>
            <p className="text-[13px] text-[#676e78]">{meta.join(" · ")}</p>
          </div>
          {week.plan ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {LIST_KEYS.filter((key) => week.plan?.[key].length).map((key) => (
                <div key={key} className="space-y-1.5">
                  <h3 className="text-[12px] font-semibold text-[#4a5059]">
                    {t(`lists.${key}`)}
                  </h3>
                  <ul className="list-disc space-y-1 pl-4 text-[13px] leading-[19px] text-[#22262b]">
                    {week.plan?.[key].map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : phase?.expectedOutput ? (
            <p className="text-[13px] text-[#22262b]">
              {t("expectedOutput", { output: phase.expectedOutput })}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <h2
            id="program-week-title"
            className="text-[15px] font-semibold text-[#22262b]"
          >
            {week.programName}
          </h2>
          <p className="text-[13px] text-[#676e78]">
            {state === ProgramWeekCardState.NotStarted && week.programStart
              ? t("notStarted", {
                  date: formatLongDate(`${week.programStart}T00:00:00`, locale),
                })
              : state === ProgramWeekCardState.Ended
                ? t("ended")
                : t("empty")}
          </p>
          {state === ProgramWeekCardState.Empty && meta.length > 0 ? (
            <p className="text-[12px] text-[#858c96]">{meta.join(" · ")}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
