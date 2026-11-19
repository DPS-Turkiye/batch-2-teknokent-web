"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { ChevronDown, History } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import { ProgramPlanDays } from "@/components/program-plan-days";
import { useProgramPastWeeks } from "@/hooks/use-program-past-weeks";
import type { ProgramWeekSoFar } from "@/interfaces/program-week";
import { occurrenceKeys } from "@/lib/keyed-list";
import { dayRangeLabel } from "@/lib/program-week";

const LIST_KEYS = ["topics", "activities", "deliverables"] as const;

/**
 * "Geçmiş haftalar" under "Bu hafta" on Süreç: the program weeks already behind the participant, newest first, each
 * a collapsed card with what was planned for it. Hidden until there is a past week.
 */
export function ProgramPastWeeks() {
  const t = useTranslations("programPastWeeks");
  const past = useProgramPastWeeks();
  const titleId = useId();
  if (past.hidden) return null;

  return (
    <section
      aria-labelledby={titleId}
      className="space-y-3 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5"
    >
      <div className="space-y-1">
        <h2
          id={titleId}
          className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4a5059]"
        >
          <History aria-hidden className="size-4" />
          {t("title")}
        </h2>
        <p className="text-[13px] text-[#676e78]">{t("subtitle")}</p>
      </div>
      {past.error ? (
        <p role="alert" className="text-[13px] text-[#b42318]">
          {t("loadFailed")}
        </p>
      ) : (
        <ul className="space-y-2">
          {past.weeks.map((week) => (
            <li key={week.plan.week}>
              <PlanWeekCard week={week} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** One week as a collapsed card with what was planned for it; used by "Geçmiş" and "Yaklaşan haftalar". */
export function PlanWeekCard({ week }: { week: ProgramWeekSoFar }) {
  const t = useTranslations("programPastWeeks");
  const tWeek = useTranslations("programThisWeek");
  const locale = useLocale();
  const { plan } = week;
  const range = dayRangeLabel(plan.startDate, plan.endDate, locale);

  return (
    <details className="group rounded-lg border border-[#e4e7ea] bg-[#fafbfb]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e86f22] [&::-webkit-details-marker]:hidden">
        <span className="space-y-0.5">
          <span className="block text-[14px] font-semibold text-[#22262b]">
            {t("weekTitle", { week: plan.week, title: plan.title })}
          </span>
          {range ? (
            <span className="block text-[12px] text-[#676e78]">{range}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-[#858c96] transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-3 border-t border-[#e4e7ea] px-4 py-3">
        <ProgramPlanDays days={week.specialDays} label={tWeek("specialDays")} />
        <ProgramPlanDays days={plan.sessions} label={t("sessions")} />
        <div className="grid gap-4 sm:grid-cols-3">
          {LIST_KEYS.filter((key) => plan[key].length > 0).map((key) => (
            <div key={key} className="space-y-1.5">
              <h3 className="text-[12px] font-semibold text-[#4a5059]">
                {tWeek(`lists.${key}`)}
              </h3>
              <ul className="list-disc space-y-1 pl-4 text-[13px] leading-[19px] text-[#22262b]">
                {occurrenceKeys(plan[key]).map((lineKey, at) => (
                  <li key={lineKey}>{plan[key][at]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
