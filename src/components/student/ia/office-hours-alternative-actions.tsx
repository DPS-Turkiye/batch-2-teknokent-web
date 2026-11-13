"use client";

import { useTranslations } from "next-intl";

import { Button, ButtonVariant } from "@/components/ia/button";
import { useOfficeHoursAlternativeAnswer } from "@/hooks/use-student-office-hours";
import type { Appointment } from "@/interfaces/appointment";

/** "Reddet" / "Önerilen Saati Kabul Et" on an Office Hours request the academician answered with another time. */
export function OfficeHoursAlternativeActions({
  appointment,
}: {
  appointment: Appointment;
}) {
  const t = useTranslations("iaStudent.officeHours.answer");
  const answer = useOfficeHoursAlternativeAnswer(appointment);
  return (
    <>
      <Button
        variant={ButtonVariant.Ghost}
        disabled={answer.isAnswering}
        onClick={() => void answer.decline()}
      >
        {t("decline")}
      </Button>
      <Button
        disabled={answer.isAnswering}
        onClick={() => void answer.accept()}
      >
        {t("accept")}
      </Button>
    </>
  );
}
