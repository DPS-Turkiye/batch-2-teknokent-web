"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { PlanWeekCard } from "@/components/startup/program-plan-week-card";
import { useProgramUpcomingWeeks } from "@/hooks/use-program-past-weeks";

/**
 * "Yaklaşan haftalar" under "Bu hafta" on Süreç: the weeks the coordinator opened before they begin, soonest first,
 * as the same collapsed cards as "Geçmiş haftalar". Hidden while there is none.
 */
export function ProgramUpcomingWeeks() {
  const t = useTranslations("programUpcomingWeeks");
  const upcoming = useProgramUpcomingWeeks();
  const titleId = useId();
  if (upcoming.hidden) return null;

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
          <CalendarClock aria-hidden className="size-4" />
          {t("title")}
        </h2>
        <p className="text-[13px] text-[#676e78]">{t("subtitle")}</p>
      </div>
      <ul className="space-y-2">
        {upcoming.weeks.map((week) => (
          <li key={week.plan.week}>
            <PlanWeekCard week={week} />
          </li>
        ))}
      </ul>
    </section>
  );
}
