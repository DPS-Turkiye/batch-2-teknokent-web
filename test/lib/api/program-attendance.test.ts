import { beforeEach, describe, expect, it, vi } from "vitest";

import { AttendanceSessionKind } from "@/interfaces/program-attendance";
import { SessionsExportFormat } from "@/interfaces/program-report";
import {
  checkInSession,
  exportProgramAttendance,
  fetchAttendanceSessions,
  fetchMyAttendance,
  fetchProgramAttendance,
  fetchSessionQr,
  markSessionAttendance,
  regenerateSessionQr,
  unmarkSessionAttendance,
} from "@/lib/api/program-attendance";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

describe("program attendance server API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the session user's attendance and checks them in with a code's token", async () => {
    await fetchMyAttendance("mentee-1");
    await checkInSession("mentee-1", "token-1");

    expect(backendRequest).toHaveBeenNthCalledWith(1, {
      method: HttpMethod.Get,
      url: "/api/programs/mine/attendance",
      params: { actorId: "mentee-1" },
    });
    // The token goes in the body, out of the request line the backend logs.
    expect(backendRequest).toHaveBeenNthCalledWith(2, {
      method: HttpMethod.Post,
      url: "/api/attendance/check-in",
      data: { actorId: "mentee-1", token: "token-1" },
    });
  });

  it("names the session by week and kind for its code and marks", async () => {
    const lesson = { week: 3, kind: AttendanceSessionKind.Lesson };
    const base =
      "/api/coordinator/programs/program%201/attendance/sessions/3/LESSON";
    await fetchAttendanceSessions("coord-1", "program 1");
    await fetchSessionQr("coord-1", "program 1", lesson);
    await regenerateSessionQr("coord-1", "program 1", lesson);
    await markSessionAttendance("coord-1", "program 1", lesson, "user/1");
    await unmarkSessionAttendance("coord-1", "program 1", lesson, "user/1");

    const calls = vi.mocked(backendRequest).mock.calls.map(([call]) => call);
    expect(calls).toEqual([
      {
        method: HttpMethod.Get,
        url: "/api/coordinator/programs/program%201/attendance/sessions",
        params: { actorId: "coord-1" },
      },
      {
        method: HttpMethod.Post,
        url: `${base}/qr`,
        params: { actorId: "coord-1" },
      },
      {
        method: HttpMethod.Post,
        url: `${base}/qr/regenerate`,
        params: { actorId: "coord-1" },
      },
      {
        method: HttpMethod.Put,
        url: `${base}/participants/user%2F1`,
        params: { actorId: "coord-1" },
      },
      {
        method: HttpMethod.Delete,
        url: `${base}/participants/user%2F1`,
        params: { actorId: "coord-1" },
      },
    ]);
  });

  it("asks for the report as the coordinator, with or without a range", async () => {
    await fetchProgramAttendance("coord-1", "program-1", null);
    await exportProgramAttendance("coord-1", "program-1", {
      range: { from: "2026-11-02", to: "2026-11-12" },
      format: SessionsExportFormat.Xlsx,
    });

    expect(itemAt(vi.mocked(backendRequest).mock.calls, 0)[0]).toMatchObject({
      url: "/api/coordinator/programs/program-1/attendance",
      params: { actorId: "coord-1" },
    });
    expect(itemAt(vi.mocked(backendRequest).mock.calls, 1)[0]).toMatchObject({
      url: "/api/coordinator/programs/program-1/attendance/export",
      params: {
        actorId: "coord-1",
        from: "2026-11-02",
        to: "2026-11-12",
        format: "XLSX",
      },
      responseType: "arraybuffer",
    });
  });
});
