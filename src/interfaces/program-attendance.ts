import type { SessionsExportFormat } from "@/interfaces/program-report";

/** Where the participant's program stands for attendance this week. */
export enum AttendanceState {
  Open = "OPEN",
  NotStarted = "NOT_STARTED",
  Ended = "ENDED",
  Unscheduled = "UNSCHEDULED",
  /** The program's coordinators do not take attendance. */
  Disabled = "DISABLED",
  NoProgram = "NO_PROGRAM",
}

/** Which session of a program week attendance is taken for. */
export enum AttendanceSessionKind {
  /** The Eğitim / Konuşmacı session on the week's first day. */
  Lesson = "LESSON",
  Workshop = "WORKSHOP",
  /** A weekly self-check-in from before attendance was taken per session. */
  Week = "WEEK",
}

/** How an attendance was recorded. */
export enum AttendanceMethod {
  /** The participant's weekly "I attended" tap, before QR codes. */
  Self = "SELF",
  Qr = "QR",
  /** A coordinator marked the participant present. */
  Manual = "MANUAL",
}

/** The backend's `code` on a refused check-in. */
export const AttendanceErrorCode = {
  /** Unknown, regenerated or expired link, or a session outside its check-in window. */
  QrNotValid: "ATTENDANCE_QR_NOT_VALID",
  /** Only on the coordinators' endpoints; a participant's scan of such a program answers QrNotValid. */
  Off: "ATTENDANCE_OFF",
  AlreadyRecorded: "ATTENDANCE_ALREADY_RECORDED",
} as const;

/** A session of the running week and when the caller checked in to it. */
export type MyAttendanceSession = {
  kind: AttendanceSessionKind;
  /** yyyy-mm-dd */
  date: string;
  /** HH:mm:ss; null when the plan prints no time. */
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  checkedInAt: string | null;
};

/** The caller's attendance in the program week running today; the week fields are null unless it is open. */
export type AttendanceStatus = {
  programId: string | null;
  programName: string | null;
  state: AttendanceState;
  week: number | null;
  totalWeeks: number | null;
  /** yyyy-mm-dd */
  weekStart: string | null;
  weekEnd: string | null;
  sessions: MyAttendanceSession[];
};

/** A report column: a week's lesson or workshop, or its weekly self-check-ins from before QR codes. */
export type ProgramAttendanceSession = {
  week: number;
  kind: AttendanceSessionKind;
  /** Null for a WEEK column, and for a session the current plan no longer has. */
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  checkedIn: number;
  participants: number;
  /** Share of participants who attended, 0–100; null without participants. */
  rate: number | null;
};

export type AttendanceMark = {
  attended: boolean;
  method: AttendanceMethod | null;
};

export type ProgramAttendanceParticipant = {
  userId: string;
  name: string;
  email: string | null;
  teamName: string | null;
  /** False for someone who attended earlier but has since left the program; they cannot be marked. */
  current: boolean;
  /** One mark per session, in the order of the report's sessions. */
  marks: AttendanceMark[];
  attendedSessions: number;
};

/** Sessions held in the weeks that overlap from–to, and every participant's attendance at them. */
export type ProgramAttendanceReport = {
  programId: string;
  from: string | null;
  to: string | null;
  attendanceEnabled: boolean;
  sessions: ProgramAttendanceSession[];
  participants: ProgramAttendanceParticipant[];
};

/** A session the coordinator can show a QR code for. */
export type AttendanceSessionSummary = {
  week: number;
  kind: AttendanceSessionKind;
  date: string;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  hasQr: boolean;
  checkedIn: number;
};

export type ProgramAttendanceSessions = {
  programId: string;
  programName: string;
  attendanceEnabled: boolean;
  sessions: AttendanceSessionSummary[];
};

/** A session's QR code: the token its link carries and when the link accepts check-ins. */
export type SessionQr = {
  programId: string;
  programName: string;
  week: number;
  kind: AttendanceSessionKind;
  date: string;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  token: string;
  /** ISO instants; opensAt inclusive, closesAt exclusive. */
  opensAt: string;
  closesAt: string;
};

/** The session a scanned code checked the caller in to. */
export type SessionCheckIn = {
  programId: string;
  programName: string;
  week: number;
  kind: AttendanceSessionKind;
  date: string;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  checkedInAt: string;
  alreadyRecorded: boolean;
};

/** One session of one week: what the QR, mark and unmark calls name. */
export type AttendanceSessionRef = {
  week: number;
  kind: AttendanceSessionKind;
};

/** Both days are yyyy-mm-dd; leaving both out covers the program from its start to today. */
export type AttendanceRange = { from: string; to: string } | null;

export type AttendanceExport = {
  range: AttendanceRange;
  format: SessionsExportFormat;
};
