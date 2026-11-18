import { describe, expect, it } from "vitest";

import {
  AttendanceErrorCode,
  AttendanceMethod,
  AttendanceSessionKind,
} from "@/interfaces/program-attendance";
import { ClientApiError } from "@/lib/client/api";
import {
  attendanceLink,
  attendanceSessionsQueryKey,
  canEditMark,
  checkInFailure,
  isAlreadyRecorded,
  markLabelKey,
  sessionKindKey,
  sessionQrQueryKey,
  sessionsByWeek,
  sessionWhen,
} from "@/lib/program-attendance";
import { CheckInFailure } from "@/types/attendance";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  attendanceReport,
  attendanceSessions,
} from "@test/fixtures/program-attendance";

describe("attendanceLink", () => {
  it("points at this site's attend page", () => {
    expect(attendanceLink("https://menton.app", "Ab_-9")).toBe(
      "https://menton.app/attend/Ab_-9",
    );
  });
});

describe("sessionWhen", () => {
  it("reads the day and, when the plan has one, the time", () => {
    expect(
      sessionWhen(
        { date: "2026-11-09", startTime: "18:00:00", endTime: "20:00:00" },
        "tr",
      ),
    ).toBe("Pzt 9 Kas · 18:00–20:00");
    expect(
      sessionWhen({ date: "2026-11-11", startTime: null, endTime: null }, "tr"),
    ).toBe("Çar 11 Kas");
  });
});

describe("query keys", () => {
  // Refreshing the sessions list must never ask the backend for the codes again.
  it("keeps a code's key beside the sessions key, not under it", () => {
    const sessions = attendanceSessionsQueryKey("program-1");
    const code = sessionQrQueryKey("program-1", {
      week: 2,
      kind: AttendanceSessionKind.Lesson,
    });

    expect(code.slice(0, sessions.length)).not.toEqual(sessions);
    expect(sessionQrQueryKey("program-1", null)).toEqual([
      "program-attendance",
      "program-1",
      "qr",
      null,
      null,
    ]);
  });
});

describe("labels", () => {
  it("names each session kind", () => {
    expect(sessionKindKey(AttendanceSessionKind.Lesson)).toBe("lesson");
    expect(sessionKindKey(AttendanceSessionKind.Workshop)).toBe("workshop");
    expect(sessionKindKey(AttendanceSessionKind.Week)).toBe("legacyWeek");
  });

  it("names how a participant attended, or that they did not", () => {
    expect(markLabelKey(undefined)).toBe("absent");
    expect(markLabelKey({ attended: false, method: null })).toBe("absent");
    expect(markLabelKey({ attended: true, method: AttendanceMethod.Qr })).toBe(
      "methodQr",
    );
    expect(
      markLabelKey({ attended: true, method: AttendanceMethod.Manual }),
    ).toBe("methodManual");
    expect(
      markLabelKey({ attended: true, method: AttendanceMethod.Self }),
    ).toBe("methodSelf");
  });
});

describe("sessionsByWeek", () => {
  it("puts each week's lesson and workshop side by side, in week order", () => {
    const { sessions } = attendanceSessions();

    const rows = sessionsByWeek([...sessions].reverse());

    expect(rows.map((row) => row.week)).toEqual([1, 2]);
    expect(itemAt(rows, 0).workshop).toBeNull();
    expect(itemAt(rows, 1).lesson?.kind).toBe(AttendanceSessionKind.Lesson);
    expect(itemAt(rows, 1).workshop?.title).toBe("Workshop: Nihan Öztürk");
  });
});

describe("checkInFailure", () => {
  it("tells apart a code that is not valid now, a non-participant, attendance off and anything else", () => {
    expect(
      checkInFailure(
        new ClientApiError("x", 409, AttendanceErrorCode.QrNotValid),
      ),
    ).toBe(CheckInFailure.NotValid);
    expect(
      checkInFailure(new ClientApiError("x", 409, AttendanceErrorCode.Off)),
    ).toBe(CheckInFailure.Off);
    expect(
      checkInFailure(new ClientApiError("x", 400, "INVALID_REQUEST")),
    ).toBe(CheckInFailure.NotValid);
    expect(checkInFailure(new ClientApiError("x", 403))).toBe(
      CheckInFailure.NotParticipant,
    );
    expect(checkInFailure(new ClientApiError("x", 502))).toBe(
      CheckInFailure.Failed,
    );
    expect(checkInFailure(new Error("network"))).toBe(CheckInFailure.Failed);
  });

  it("reads a second, racing scan as already recorded", () => {
    expect(
      isAlreadyRecorded(
        new ClientApiError("x", 409, AttendanceErrorCode.AlreadyRecorded),
      ),
    ).toBe(true);
    expect(isAlreadyRecorded(new ClientApiError("x", 409))).toBe(false);
    expect(isAlreadyRecorded(new Error("x"))).toBe(false);
  });
});

describe("canEditMark", () => {
  const report = attendanceReport();
  const lesson = itemAt(report.sessions, 0);
  const weekly = itemAt(report.sessions, 1);
  const current = itemAt(report.participants, 0);
  const former = itemAt(report.participants, 1);

  it("allows a current participant's lesson or workshop while attendance is on", () => {
    expect(canEditMark(current, lesson, true)).toBe(true);
  });

  it("keeps weekly check-ins, former participants and a program without attendance as they are", () => {
    expect(canEditMark(current, weekly, true)).toBe(false);
    expect(canEditMark(former, lesson, true)).toBe(false);
    expect(canEditMark(current, lesson, false)).toBe(false);
  });
});
