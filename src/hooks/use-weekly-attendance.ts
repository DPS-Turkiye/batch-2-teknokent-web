"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import {
  AttendanceState,
  type AttendanceStatus,
} from "@/interfaces/program-attendance";
import { getMyAttendance } from "@/lib/client/program-attendance";
import { sessionKindKey, sessionWhen } from "@/lib/program-attendance";
import { calendarDay, formatDayMonth } from "@/lib/utils";

export const WEEKLY_ATTENDANCE_QUERY_KEY = [
  "program-attendance",
  "mine",
] as const;

/** "10 Kas – 16 Kas" for the running week, or null when no week is running. */
export function weekRangeLabel(status: AttendanceStatus, locale: string) {
  if (!status.weekStart || !status.weekEnd) return null;
  return `${formatDayMonth(calendarDay(status.weekStart), locale)} – ${formatDayMonth(calendarDay(status.weekEnd), locale)}`;
}

/** Why no session is listed, for the states that have something to say. */
function closedMessageKey(state: AttendanceState) {
  switch (state) {
    case AttendanceState.NotStarted:
      return "notStarted";
    case AttendanceState.Ended:
      return "ended";
    case AttendanceState.Unscheduled:
      return "unscheduled";
    case AttendanceState.Open:
    case AttendanceState.Disabled:
    case AttendanceState.NoProgram:
      return null;
  }
}

/**
 * Süreç: which of this week's sessions the participant's attendance was taken at. Read only: attendance is taken by
 * scanning the session's QR code, or by a coordinator.
 */
export function useWeeklyAttendance() {
  const t = useTranslations("weeklyAttendance");
  const locale = useLocale();
  const query = useQuery({
    queryKey: WEEKLY_ATTENDANCE_QUERY_KEY,
    queryFn: getMyAttendance,
  });
  const status = query.data;
  const weekRange = status ? weekRangeLabel(status, locale) : null;
  const closedKey = status ? closedMessageKey(status.state) : null;
  return {
    isLoading: query.isLoading,
    error: query.error,
    /** Nothing to show outside every program, or where the coordinators take no attendance. */
    visible:
      status != null &&
      status.state !== AttendanceState.NoProgram &&
      status.state !== AttendanceState.Disabled,
    open: status?.state === AttendanceState.Open,
    /** "Hafta 2/8 · 9 Kas – 15 Kas" */
    subtitle:
      status?.week != null
        ? [
            status.totalWeeks
              ? t("weekOf", { week: status.week, total: status.totalWeeks })
              : t("week", { week: status.week }),
            weekRange,
          ]
            .filter(Boolean)
            .join(" · ")
        : null,
    closedMessage: closedKey ? t(closedKey) : null,
    sessions: (status?.sessions ?? []).map((session) => ({
      kind: session.kind,
      name: t(sessionKindKey(session.kind)),
      when: sessionWhen(session, locale),
      attended: session.checkedInAt !== null,
    })),
  };
}
