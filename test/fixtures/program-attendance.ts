import {
  AttendanceState,
  type AttendanceStatus,
  type ProgramAttendanceReport,
} from "@/interfaces/program-attendance";

export function attendanceStatus(
  overrides: Partial<AttendanceStatus> = {},
): AttendanceStatus {
  return {
    programId: "program-1",
    programName: "ODTÜ Stars 2026",
    state: AttendanceState.Open,
    week: 2,
    totalWeeks: 8,
    weekStart: "2026-11-09",
    weekEnd: "2026-11-15",
    checkedInAt: null,
    ...overrides,
  };
}

export function attendanceReport(
  overrides: Partial<ProgramAttendanceReport> = {},
): ProgramAttendanceReport {
  return {
    programId: "program-1",
    from: "2026-11-02",
    to: "2026-11-12",
    weeks: [
      {
        number: 1,
        start: "2026-11-02",
        end: "2026-11-08",
        checkedIn: 0,
        participants: 2,
        rate: 0,
      },
      {
        number: 2,
        start: "2026-11-09",
        end: "2026-11-15",
        checkedIn: 1,
        participants: 2,
        rate: 50,
      },
    ],
    participants: [
      {
        name: "Gülse Buran",
        email: "gulse@dongu.app",
        teamName: "Döngü",
        attended: [false, true],
        attendedWeeks: 1,
      },
      {
        name: "Mert Kaya",
        email: "mert@dongu.app",
        teamName: "Döngü",
        attended: [false, false],
        attendedWeeks: 0,
      },
    ],
    ...overrides,
  };
}
