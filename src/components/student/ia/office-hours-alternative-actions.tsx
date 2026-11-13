"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button, ButtonVariant } from "@/components/ia/button";
import { useOfficeHoursAlternativeAnswer } from "@/hooks/use-student-office-hours";
import type { Appointment } from "@/interfaces/appointment";
import { timeLabel } from "@/lib/calendar";
import { formatDayMonth } from "@/lib/utils";

/**
 * "Reddet" / "Önerilen Saati Kabul Et" on an Office Hours request the academician answered with other times; with
 * more than one time offered, one accept button per time.
 */
export function OfficeHoursAlternativeActions({
  appointment,
}: {
  appointment: Appointment;
}) {
  const t = useTranslations("iaStudent.officeHours.answer");
  const locale = useLocale();
  const answer = useOfficeHoursAlternativeAnswer(appointment);
  const [only] = answer.times;
  return (
    <>
      {answer.canDecline ? (
        <Button
          variant={ButtonVariant.Ghost}
          disabled={answer.isAnswering}
          onClick={() => void answer.decline()}
        >
          {t("decline")}
        </Button>
      ) : null}
      {answer.times.length === 1 && only ? (
        <Button
          disabled={answer.isAnswering}
          onClick={() => void answer.accept(only.startsAt)}
        >
          {t("accept")}
        </Button>
      ) : (
        // TEST UI: placeholder until the design team's screen; replace when it arrives.
        answer.times.map((time) => (
          <Button
            key={time.startsAt}
            disabled={answer.isAnswering}
            onClick={() => void answer.accept(time.startsAt)}
          >
            {t("acceptTime", {
              time: `${formatDayMonth(new Date(time.startsAt), locale)} · ${timeLabel(time.startsAt, locale)}`,
            })}
          </Button>
        ))
      )}
    </>
  );
}
