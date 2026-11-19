// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { useWeeklyAttendance } from "@/hooks/use-weekly-attendance";

/** Süreç: this week's sessions and whether the participant's attendance was taken at each (by QR code). */
export function WeeklyAttendance() {
  const t = useTranslations("weeklyAttendance");
  const titleId = useId();
  const { visible, open, subtitle, closedMessage, sessions } =
    useWeeklyAttendance();
  if (!visible) return null;

  return (
    <section
      aria-labelledby={titleId}
      className="space-y-3 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5 lg:min-w-[280px]"
    >
      <div>
        <h2 id={titleId} className="text-[15px] font-semibold text-[#22262b]">
          {t("title")}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12.5px] text-[#858c96]">{subtitle}</p>
        ) : null}
      </div>

      {open ? (
        <>
          {sessions.length === 0 ? (
            <p className="text-[13px] text-[#858c96]">{t("noSessions")}</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li
                  key={session.kind}
                  className="flex items-start justify-between gap-3 text-[13px]"
                >
                  <span>
                    <span className="font-medium text-[#22262b]">
                      {session.name}
                    </span>
                    <span className="block text-[12px] text-[#858c96]">
                      {session.when}
                    </span>
                  </span>
                  {session.attended ? (
                    <span className="flex shrink-0 items-center gap-1 text-[#1f7a4d]">
                      <Check aria-hidden className="size-4" />
                      {t("present")}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[#858c96]">
                      {t("absent")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12px] text-[#858c96]">{t("hint")}</p>
        </>
      ) : closedMessage ? (
        <p className="text-[13px] text-[#858c96]">{closedMessage}</p>
      ) : null}
    </section>
  );
}
