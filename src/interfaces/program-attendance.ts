import type { SessionsExportFormat } from "@/interfaces/program-report";

/** Whether the participant can check in this week, and if not, why. */
export enum AttendanceState {
  Open = "OPEN",
  CheckedIn = "CHECKED_IN",
  NotStarted = "NOT_STARTED",
  Ended = "ENDED",
  Unscheduled = "UNSCHEDULED",
  NoProgram = "NO_PROGRAM",
}

/** The caller's check-in for the program week running today; the week fields are null when none is. */
export type AttendanceStatus = {
  programId: string | null;
  programName: string | null;
  state: AttendanceState;
  week: number | null;
  totalWeeks: number | null;
  /** yyyy-mm-dd */
  weekStart: string | null;
  weekEnd: string | null;
  checkedInAt: string | null;
};

export type ProgramAttendanceWeek = {
  number: number;
  start: string;
  end: string;
  checkedIn: number;
  participants: number;
  /** Share of participants who checked in, 0–100; null without participants. */
  rate: number | null;
};

export type ProgramAttendanceParticipant = {
  name: string;
  email: string | null;
  teamName: string | null;
  /** One flag per week, in the order of the report's weeks. */
  attended: boolean[];
  attendedWeeks: number;
};

/** Weeks that overlap from–to and have begun, and every participant's check-ins in them. */
export type ProgramAttendanceReport = {
  programId: string;
  from: string | null;
  to: string | null;
  weeks: ProgramAttendanceWeek[];
  participants: ProgramAttendanceParticipant[];
};

/** Both days are yyyy-mm-dd; leaving both out covers the program from its start to today. */
export type AttendanceRange = { from: string; to: string } | null;

export type AttendanceExport = {
  range: AttendanceRange;
  format: SessionsExportFormat;
};
