"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useRequestAnswer } from "@/hooks/use-request-answer";
import {
  MAX_PROPOSED_TIMES,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import type { AppointmentTime } from "@/interfaces/appointment";
import type { CalendarSource } from "@/lib/academician-calendar";
import { TURKEY_TIME_ZONE } from "@/lib/academician-office-hours";
import {
  proposableDays,
  proposalPayload,
  toggleProposed,
} from "@/lib/academician-proposals";

/**
 * "Alternatif saat öner": pick up to three free times, from any of the next weekdays, and an optional note. The
 * request then waits for the student, who accepts one of them or not.
 */
export function useProposeTimes(
  request: OfficeHoursRequest,
  {
    source,
    now,
    onDone,
  }: { source: CalendarSource; now: Date; onDone: () => void },
) {
  const t = useTranslations("iaAcademician.propose");
  const locale = useLocale();
  const { answer, answeringId } = useRequestAnswer();
  const days = proposableDays(source, { now, excludeRequestId: request.id });
  const firstOpen = days.find((day) => day.open) ?? days[0];
  const [selectedDay, setSelectedDay] = useState(firstOpen?.day ?? null);
  const [selected, setSelected] = useState<AppointmentTime[]>([]);
  const [note, setNote] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TURKEY_TIME_ZONE,
  });
  const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dayHeading = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const pickedLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TURKEY_TIME_ZONE,
  });
  const isPicked = (time: AppointmentTime) =>
    selected.some((item) => item.startsAt === time.startsAt);
  const shownDay = days.find((day) => day.day === selectedDay) ?? null;
  const [requested] = request.requestedTimes;

  const toggle = (time: AppointmentTime) => {
    const next = toggleProposed(selected, time);
    setLimitReached(next.length === selected.length && !isPicked(time));
    setSelected(next);
  };

  return {
    studentName: request.student.fullName,
    requested: requested
      ? t("requested", {
          name: request.student.fullName,
          when: new Intl.DateTimeFormat(locale, {
            day: "numeric",
            month: "short",
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: TURKEY_TIME_ZONE,
          }).format(new Date(requested.startsAt)),
        })
      : request.student.fullName,
    days: days.map((day) => ({
      key: day.day,
      weekday: weekdayShort.format(day.date).replace(".", ""),
      dayNumber: day.date.getDate(),
      open: day.open,
      current: day.day === selectedDay,
      select: () => {
        setSelectedDay(day.day);
      },
    })),
    dayHeading: shownDay
      ? t("dayHeading", { day: dayHeading.format(shownDay.date) })
      : null,
    slots: (shownDay?.slots ?? []).map((slot) => ({
      key: slot.time.startsAt,
      label: clock.format(new Date(slot.time.startsAt)),
      taken: slot.taken,
      picked: isPicked(slot.time),
      toggle: () => {
        toggle(slot.time);
      },
    })),
    picked: selected.map((time) => ({
      key: time.startsAt,
      label: pickedLabel.format(new Date(time.startsAt)),
      remove: () => {
        toggle(time);
      },
    })),
    max: MAX_PROPOSED_TIMES,
    limitReached,
    note,
    setNote,
    canSend: selected.length > 0 && answeringId !== request.id,
    send: () => {
      answer(request.id, proposalPayload(selected, note), onDone);
    },
  };
}

export type ProposeTimesState = ReturnType<typeof useProposeTimes>;
