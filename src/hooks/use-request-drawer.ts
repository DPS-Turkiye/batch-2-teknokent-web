"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useRequestAnswer } from "@/hooks/use-request-answer";
import {
  OfficeHoursRequestAction,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import { requestFit, type CalendarSource } from "@/lib/academician-calendar";
import { TURKEY_TIME_ZONE } from "@/lib/academician-office-hours";
import { formatDateRange } from "@/lib/format";

/** The "Randevu talebi" drawer: pick one of the requested times, then accept or decline. */
export function useRequestDrawer(
  request: OfficeHoursRequest,
  {
    source,
    now,
    onClose,
  }: {
    source: Pick<CalendarSource, "availability" | "appointments">;
    now: Date;
    onClose: () => void;
  },
) {
  const t = useTranslations("iaAcademician");
  const tWeekday = useTranslations("options.weekday");
  const locale = useLocale();
  const { answer, answeringId } = useRequestAnswer();
  const [only] = request.requestedTimes;
  // One requested time is the answer already; several wait for a choice.
  const [picked, setPicked] = useState<string | null>(
    request.requestedTimes.length === 1 && only ? only.startsAt : null,
  );
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const pickedTime =
    request.requestedTimes.find((time) => time.startsAt === picked) ?? null;
  const allowed = (action: OfficeHoursRequestAction) =>
    request.allowedActions.includes(action);
  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
    timeZone: TURKEY_TIME_ZONE,
  });
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TURKEY_TIME_ZONE,
  });
  const fit = pickedTime ? requestFit(pickedTime, source, now) : null;

  return {
    classYear:
      request.student.classYear === null
        ? null
        : t("common.classYear", { year: request.student.classYear }),
    times: request.requestedTimes.map((time) => ({
      key: time.startsAt,
      date: dateFormat.format(new Date(time.startsAt)),
      hours: formatDateRange(
        clock,
        new Date(time.startsAt),
        new Date(time.endsAt),
      ),
      checked: time.startsAt === picked,
    })),
    pick: setPicked,
    fit: fit
      ? {
          kind: fit.fit,
          text: t(`requestDrawer.fit.${fit.fit}`, {
            weekday: tWeekday(fit.weekday),
          }),
        }
      : null,
    canAccept: allowed(OfficeHoursRequestAction.Accept),
    canDecline: allowed(OfficeHoursRequestAction.Decline),
    canPropose: allowed(OfficeHoursRequestAction.ProposeTimes),
    isBusy: answeringId === request.id,
    accept: () => {
      if (pickedTime === null) return;
      answer(
        request.id,
        { action: OfficeHoursRequestAction.Accept, time: pickedTime },
        onClose,
      );
    },
    hasPick: pickedTime !== null,
    declining,
    startDecline: () => {
      setDeclining(true);
    },
    stopDecline: () => {
      setDeclining(false);
    },
    reason,
    setReason,
    decline: () => {
      answer(
        request.id,
        {
          action: OfficeHoursRequestAction.Decline,
          reason: reason.trim() || null,
        },
        onClose,
      );
    },
  };
}

export type RequestDrawerState = ReturnType<typeof useRequestDrawer>;
