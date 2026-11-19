"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { PlanWeekCard } from "@/components/startup/program-plan-week-card";
import { useProgramPastWeeks } from "@/hooks/use-program-past-weeks";

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
