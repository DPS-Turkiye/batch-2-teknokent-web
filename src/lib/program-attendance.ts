import {
  AttendanceErrorCode,
  AttendanceMethod,
  AttendanceSessionKind,
  type AttendanceMark,
  type AttendanceSessionRef,
  type AttendanceSessionSummary,
  type ProgramAttendanceParticipant,
  type ProgramAttendanceSession,
} from "@/interfaces/program-attendance";
import { ClientApiError } from "@/lib/client/api";
import { planDayLabel } from "@/lib/program-week";
import { attendancePath } from "@/lib/public-paths";
import { CheckInFailure } from "@/types/attendance";

/** The full link a QR code carries; `origin` is this site's (never an outside QR service). */
export function attendanceLink(origin: string, token: string) {
  return `${origin}${attendancePath(token)}`;
}

/** "Pzt 16 Kas · 18:00–20:00", or only the day for a session without a time. */
export function sessionWhen(
  session: { date: string; startTime: string | null; endTime: string | null },
  locale: string,
) {
  return planDayLabel({ ...session, place: null, title: null }, locale);
}

export function attendanceSessionsQueryKey(programId: string) {
  return ["program-attendance", programId, "sessions"] as const;
}

/** A sibling of the sessions key, so refreshing the sessions never asks for the codes again. */
export function sessionQrQueryKey(
  programId: string,
  session: AttendanceSessionRef | null,
) {
  return [
    "program-attendance",
    programId,
    "qr",
    session?.week ?? null,
    session?.kind ?? null,
  ] as const;
}

/** The message key that names a session kind: Eğitim, Workshop, or the weekly check-ins from before QR codes. */
export function sessionKindKey(kind: AttendanceSessionKind) {
  switch (kind) {
    case AttendanceSessionKind.Lesson:
      return "lesson";
    case AttendanceSessionKind.Workshop:
      return "workshop";
    case AttendanceSessionKind.Week:
      return "legacyWeek";
  }
}

/** The message key for a report cell: how the participant attended, or that they did not. */
export function markLabelKey(mark: AttendanceMark | undefined) {
  if (!mark?.attended) return "absent";
  switch (mark.method) {
    case AttendanceMethod.Manual:
      return "methodManual";
    case AttendanceMethod.Self:
      return "methodSelf";
    case AttendanceMethod.Qr:
    case null:
      return "methodQr";
  }
}

/** A week's lesson and workshop side by side; a week without a workshop has null there. */
export type AttendanceWeekRow = {
  week: number;
  lesson: AttendanceSessionSummary | null;
  workshop: AttendanceSessionSummary | null;
};

export function sessionsByWeek(
  sessions: readonly AttendanceSessionSummary[],
): AttendanceWeekRow[] {
  const rows = new Map<number, AttendanceWeekRow>();
  for (const session of sessions) {
    const row = rows.get(session.week) ?? {
      week: session.week,
      lesson: null,
      workshop: null,
    };
    if (session.kind === AttendanceSessionKind.Lesson) row.lesson = session;
    if (session.kind === AttendanceSessionKind.Workshop) row.workshop = session;
    rows.set(session.week, row);
  }
  return [...rows.values()].sort((a, b) => a.week - b.week);
}

/** Why a check-in recorded nothing, from the backend's status and code. */
export function checkInFailure(error: unknown): CheckInFailure {
  if (!(error instanceof ClientApiError)) return CheckInFailure.Failed;
  // A link that is not even a token's shape (400) reads like any other dead link.
  if (error.code === AttendanceErrorCode.QrNotValid || error.status === 400) {
    return CheckInFailure.NotValid;
  }
  if (error.status === 403) return CheckInFailure.NotParticipant;
  return CheckInFailure.Failed;
}

/** Two scans racing each other: the second finds the first already saved, which is a success. */
export function isAlreadyRecorded(error: unknown) {
  return (
    error instanceof ClientApiError &&
    error.code === AttendanceErrorCode.AlreadyRecorded
  );
}

/**
 * Whether a coordinator may mark or unmark this cell by hand: a current participant, in a program that takes
 * attendance, at a lesson or workshop (a weekly check-in from before QR codes is kept as it is).
 */
export function canEditMark(
  participant: ProgramAttendanceParticipant,
  session: ProgramAttendanceSession,
  attendanceEnabled: boolean,
) {
  return (
    attendanceEnabled &&
    participant.current &&
    session.kind !== AttendanceSessionKind.Week
  );
}
