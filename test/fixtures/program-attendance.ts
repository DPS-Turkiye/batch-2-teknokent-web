import {
  AttendanceMethod,
  AttendanceSessionKind,
  AttendanceState,
  type AttendanceStatus,
  type ProgramAttendanceReport,
  type ProgramAttendanceSessions,
  type SessionCheckIn,
  type SessionQr,
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
    sessions: [
      {
        kind: AttendanceSessionKind.Lesson,
        date: "2026-11-09",
        startTime: "18:00:00",
        endTime: "20:00:00",
        title: "Müşteri / PMF",
        checkedInAt: "2026-11-09T15:05:00Z",
      },
      {
        kind: AttendanceSessionKind.Workshop,
        date: "2026-11-11",
        startTime: null,
        endTime: null,
        title: "Workshop: Sarper",
        checkedInAt: null,
      },
    ],
    ...overrides,
  };
}

/** Week 1's lesson, the weekly self-check-ins from before QR codes, and week 2's lesson. */
export function attendanceReport(
  overrides: Partial<ProgramAttendanceReport> = {},
): ProgramAttendanceReport {
  return {
    programId: "program-1",
    from: "2026-11-02",
    to: "2026-11-12",
    attendanceEnabled: true,
    sessions: [
      {
        week: 1,
        kind: AttendanceSessionKind.Lesson,
        date: "2026-11-02",
        startTime: null,
        endTime: null,
        title: "Hafta 1",
        checkedIn: 0,
        participants: 2,
        rate: 0,
      },
      {
        week: 1,
        kind: AttendanceSessionKind.Week,
        date: null,
        startTime: null,
        endTime: null,
        title: null,
        checkedIn: 1,
        participants: 2,
        rate: 50,
      },
      {
        week: 2,
        kind: AttendanceSessionKind.Lesson,
        date: "2026-11-09",
        startTime: "18:00:00",
        endTime: "20:00:00",
        title: "Müşteri / PMF",
        checkedIn: 1,
        participants: 2,
        rate: 50,
      },
    ],
    participants: [
      {
        userId: "user-gulse",
        name: "Gülse Buran",
        email: "gulse@dongu.app",
        teamName: "Döngü",
        current: true,
        marks: [
          { attended: false, method: null },
          { attended: true, method: AttendanceMethod.Self },
          { attended: true, method: AttendanceMethod.Qr },
        ],
        attendedSessions: 2,
      },
      {
        userId: "user-mert",
        name: "Mert Kaya",
        email: "mert@dongu.app",
        teamName: null,
        current: false,
        marks: [
          { attended: true, method: AttendanceMethod.Manual },
          { attended: false, method: null },
          { attended: false, method: null },
        ],
        attendedSessions: 1,
      },
    ],
    ...overrides,
  };
}

export function attendanceSessions(
  overrides: Partial<ProgramAttendanceSessions> = {},
): ProgramAttendanceSessions {
  return {
    programId: "program-1",
    programName: "Build",
    attendanceEnabled: true,
    sessions: [
      {
        week: 1,
        kind: AttendanceSessionKind.Lesson,
        date: "2026-11-02",
        startTime: null,
        endTime: null,
        title: "Build'a Başla",
        hasQr: true,
        checkedIn: 4,
      },
      {
        week: 2,
        kind: AttendanceSessionKind.Lesson,
        date: "2026-11-09",
        startTime: "18:00:00",
        endTime: "20:00:00",
        title: null,
        hasQr: false,
        checkedIn: 0,
      },
      {
        week: 2,
        kind: AttendanceSessionKind.Workshop,
        date: "2026-11-11",
        startTime: null,
        endTime: null,
        title: "Workshop: Nihan Öztürk",
        hasQr: false,
        checkedIn: 0,
      },
    ],
    ...overrides,
  };
}

export function sessionQr(overrides: Partial<SessionQr> = {}): SessionQr {
  return {
    programId: "program-1",
    programName: "Build",
    week: 2,
    kind: AttendanceSessionKind.Lesson,
    date: "2026-11-09",
    startTime: "18:00:00",
    endTime: "20:00:00",
    title: "Müşteri / PMF",
    token: "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde",
    opensAt: "2026-11-09T14:30:00Z",
    closesAt: "2026-11-09T18:00:00Z",
    ...overrides,
  };
}

export function sessionCheckIn(
  overrides: Partial<SessionCheckIn> = {},
): SessionCheckIn {
  return {
    programId: "program-1",
    programName: "Build",
    week: 2,
    kind: AttendanceSessionKind.Workshop,
    date: "2026-11-11",
    startTime: null,
    endTime: null,
    title: "Workshop: Nihan Öztürk",
    checkedInAt: "2026-11-11T10:00:00Z",
    alreadyRecorded: false,
    ...overrides,
  };
}
