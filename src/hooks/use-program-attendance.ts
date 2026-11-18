"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import type {
  AttendanceRange,
  ProgramAttendanceParticipant,
  ProgramAttendanceSession,
} from "@/interfaces/program-attendance";
import type { SessionsExportFormat } from "@/interfaces/program-report";
import { ToastTone } from "@/interfaces/toast";
import {
  getProgramAttendance,
  markSessionAttendance,
  programAttendanceExportHref,
  unmarkSessionAttendance,
} from "@/lib/client/program-attendance";
import {
  attendanceSessionsQueryKey,
  canEditMark,
  markLabelKey,
  sessionKindKey,
} from "@/lib/program-attendance";
import { calendarDay, errorMessage, formatDayMonth } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

type MarkInput = {
  participant: ProgramAttendanceParticipant;
  session: ProgramAttendanceSession;
  attended: boolean;
};

/**
 * The coordinator's attendance report, one column per session. With both days empty it covers the program from
 * its start to today; a range needs both days, in order. A cell can be marked or unmarked by hand for a current
 * participant (a phone that could not scan).
 */
export function useProgramAttendance(programId: string) {
  const t = useTranslations("programReport.attendance");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [days, setDays] = useState({ from: "", to: "" });
  const filtered = Boolean(days.from || days.to);
  const valid =
    !filtered || (Boolean(days.from && days.to) && days.from <= days.to);
  const range: AttendanceRange =
    filtered && valid ? { from: days.from, to: days.to } : null;
  const query = useQuery({
    queryKey: ["program-attendance", programId, "report", range],
    queryFn: () => getProgramAttendance(programId, range),
    enabled: valid,
  });
  const mark = useMutation({
    mutationFn: ({ participant, session, attended }: MarkInput) => {
      const ref = { week: session.week, kind: session.kind };
      return attended
        ? unmarkSessionAttendance(programId, ref, participant.userId)
        : markSessionAttendance(programId, ref, participant.userId);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["program-attendance", programId, "report"],
        }),
        queryClient.invalidateQueries({
          queryKey: attendanceSessionsQueryKey(programId),
        }),
      ]),
    onError: (error: Error) => {
      showToast({
        message: errorMessage(error, t("markFailed")),
        tone: ToastTone.Error,
      });
    },
  });
  const data = query.data;
  const enabled = data?.attendanceEnabled ?? false;

  const sessionLabel = (session: ProgramAttendanceSession) => {
    const name = t(sessionKindKey(session.kind));
    return session.date
      ? `${name} ${formatDayMonth(calendarDay(session.date), locale)}`
      : name;
  };

  return {
    ...days,
    valid,
    filtered,
    query,
    setFrom: (from: string) => setDays((current) => ({ ...current, from })),
    setTo: (to: string) => setDays((current) => ({ ...current, to })),
    clear: () => setDays({ from: "", to: "" }),
    exportHref: (format: SessionsExportFormat) =>
      valid
        ? programAttendanceExportHref(programId, { range, format })
        : undefined,
    /** "Eğitim 16 Kas", "Workshop 18 Kas", "Haftalık (eski)": a column's name under its week. */
    sessionLabel,
    /**
     * One report cell: whether the participant attended and how, and for a cell a coordinator may change, the
     * toggle's name (its state is `attended`). A participant's marks come in the order of the report's sessions.
     */
    cell: (participant: ProgramAttendanceParticipant, index: number) => {
      const session = data?.sessions[index];
      const current = participant.marks[index];
      const attended = current?.attended ?? false;
      const editable =
        session && canEditMark(participant, session, enabled) ? session : null;
      return {
        attended,
        status: t(markLabelKey(current)),
        toggleLabel: editable
          ? t("markToggle", {
              name: participant.name,
              session: `${t("week", { week: editable.week })} ${sessionLabel(editable)}`,
            })
          : null,
        // While one change is on its way the buttons stay put (so focus does too); further clicks wait.
        toggle: () => {
          if (editable && !mark.isPending) {
            mark.mutate({ participant, session: editable, attended });
          }
        },
      };
    },
  };
}
