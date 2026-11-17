"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useLocale } from "next-intl";

import type {
  ProgramSession,
  ProgramSpecialDay,
} from "@/interfaces/program-week";
import { occurrenceKeys } from "@/lib/keyed-list";
import { planDayLabel } from "@/lib/program-week";

/** A week's dated sessions, or a plan's special days, one line each with the syllabus's own date, time and place. */
export function ProgramPlanDays({
  days,
  ...name
}: {
  days: readonly (ProgramSession | ProgramSpecialDay)[];
} & ({ label: string } | { labelledBy: string })) {
  const locale = useLocale();
  if (days.length === 0) return null;
  const lines = days.map((day) => planDayLabel(day, locale));
  const keys = occurrenceKeys(lines);

  return (
    <ul
      {...("label" in name
        ? { "aria-label": name.label }
        : { "aria-labelledby": name.labelledBy })}
      className="space-y-1.5"
    >
      {days.map((day, index) => (
        <li key={keys[index]} className="text-[12.5px] text-[#22262b]">
          {lines[index]}
          {"details" in day && day.details.length > 0 ? (
            <ul className="mt-0.5 list-disc pl-5 text-[12px] text-[#676e78]">
              {occurrenceKeys(day.details).map((key, at) => (
                <li key={key}>{day.details[at]}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
