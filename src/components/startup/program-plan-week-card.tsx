"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ProgramPlanDays } from "@/components/program-plan-days";
import type { ProgramWeekSoFar } from "@/interfaces/program-week";
import { occurrenceKeys } from "@/lib/keyed-list";
import { dayRangeLabel } from "@/lib/program-week";

const LIST_KEYS = ["topics", "activities", "deliverables"] as const;

/** One week as a collapsed card with what was planned for it, in "Geçmiş haftalar" and "Yaklaşan haftalar". */
export function PlanWeekCard({ week }: { week: ProgramWeekSoFar }) {
  const t = useTranslations("programPlanWeekCard");
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
