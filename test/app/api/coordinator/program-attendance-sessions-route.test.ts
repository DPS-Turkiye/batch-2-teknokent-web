import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PUT as markRoute,
  DELETE as unmarkRoute,
} from "@/app/api/coordinator/programs/[id]/attendance/sessions/[week]/[kind]/participants/[userId]/route";
import { POST as regenerateRoute } from "@/app/api/coordinator/programs/[id]/attendance/sessions/[week]/[kind]/qr/regenerate/route";
import { POST as qrRoute } from "@/app/api/coordinator/programs/[id]/attendance/sessions/[week]/[kind]/qr/route";
import { GET as sessionsRoute } from "@/app/api/coordinator/programs/[id]/attendance/sessions/route";
import { AttendanceSessionKind } from "@/interfaces/program-attendance";
import { UserRole } from "@/interfaces/session";
import {
  fetchAttendanceSessions,
  fetchSessionQr,
  markSessionAttendance,
  regenerateSessionQr,
  unmarkSessionAttendance,
} from "@/lib/api/program-attendance";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-attendance", () => ({
  fetchAttendanceSessions: vi.fn(),
  fetchSessionQr: vi.fn(),
  regenerateSessionQr: vi.fn(),
  markSessionAttendance: vi.fn(),
  unmarkSessionAttendance: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const USER = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const request = new Request("http://localhost/api/x");
const program = { params: Promise.resolve({ id: "program-1" }) };
const session = (week: string, kind: string) => ({
  params: Promise.resolve({ id: "program-1", week, kind }),
});
const participant = (week: string, kind: string, userId: string) => ({
  params: Promise.resolve({ id: "program-1", week, kind, userId }),
});

describe("coordinator attendance session routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "coord-1", role: UserRole.Coordinator }),
    });
    answerEachWith([
      fetchAttendanceSessions,
      fetchSessionQr,
      regenerateSessionQr,
    ]);
    answerEachWith(
      [markSessionAttendance, unmarkSessionAttendance],
      backendResponse(null, 204),
    );
  });

  it("asks for the sessions, a code and a new code as the session coordinator", async () => {
    await sessionsRoute(request, program);
    await qrRoute(request, session("2", "LESSON"));
    await regenerateRoute(request, session("2", "WORKSHOP"));

    expect(fetchAttendanceSessions).toHaveBeenCalledWith(
      "coord-1",
      "program-1",
    );
    expect(fetchSessionQr).toHaveBeenCalledWith("coord-1", "program-1", {
      week: 2,
      kind: AttendanceSessionKind.Lesson,
    });
    expect(regenerateSessionQr).toHaveBeenCalledWith("coord-1", "program-1", {
      week: 2,
      kind: AttendanceSessionKind.Workshop,
    });
  });

  it("marks and unmarks a participant, answering the backend's 204", async () => {
    const marked = await markRoute(request, participant("1", "LESSON", USER));
    const unmarked = await unmarkRoute(request, participant("1", "WEEK", USER));

    expect(marked.status).toBe(204);
    expect(unmarked.status).toBe(204);
    expect(markSessionAttendance).toHaveBeenCalledWith(
      "coord-1",
      "program-1",
      { week: 1, kind: AttendanceSessionKind.Lesson },
      USER,
    );
    expect(unmarkSessionAttendance).toHaveBeenCalledWith(
      "coord-1",
      "program-1",
      { week: 1, kind: AttendanceSessionKind.Week },
      USER,
    );
  });

  it("refuses a malformed week, kind or person before asking the backend", async () => {
    for (const [week, kind] of [
      ["0", "LESSON"],
      ["1.5", "LESSON"],
      ["abc", "LESSON"],
      ["2", "lesson"],
      ["2", "BOTH"],
    ] as const) {
      expect((await qrRoute(request, session(week, kind))).status).toBe(400);
      expect((await regenerateRoute(request, session(week, kind))).status).toBe(
        400,
      );
    }
    expect(
      (await markRoute(request, participant("2", "LESSON", "not-a-uuid")))
        .status,
    ).toBe(400);
    expect(
      (await unmarkRoute(request, participant("x", "LESSON", USER))).status,
    ).toBe(400);
    expect(fetchSessionQr).not.toHaveBeenCalled();
    expect(regenerateSessionQr).not.toHaveBeenCalled();
    expect(markSessionAttendance).not.toHaveBeenCalled();
    expect(unmarkSessionAttendance).not.toHaveBeenCalled();
  });

  it("stops anyone who is not a coordinator or an admin", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect((await sessionsRoute(request, program)).status).toBe(403);
    expect((await qrRoute(request, session("2", "LESSON"))).status).toBe(403);
    expect(
      (await regenerateRoute(request, session("2", "LESSON"))).status,
    ).toBe(403);
    expect(
      (await markRoute(request, participant("2", "LESSON", USER))).status,
    ).toBe(403);
    expect(
      (await unmarkRoute(request, participant("2", "LESSON", USER))).status,
    ).toBe(403);
    expect(fetchAttendanceSessions).not.toHaveBeenCalled();
    expect(fetchSessionQr).not.toHaveBeenCalled();
  });

  it("answers 502 with a translated message when the backend is down", async () => {
    vi.mocked(fetchSessionQr).mockRejectedValue(new Error("down"));
    vi.mocked(markSessionAttendance).mockRejectedValue(new Error("down"));
    vi.mocked(fetchAttendanceSessions).mockRejectedValue(new Error("down"));

    expect((await qrRoute(request, session("2", "LESSON"))).status).toBe(502);
    expect(
      (await markRoute(request, participant("2", "LESSON", USER))).status,
    ).toBe(502);
    expect((await sessionsRoute(request, program)).status).toBe(502);
  });
});
