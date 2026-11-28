import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AttendanceErrorCode,
  AttendanceSessionKind,
} from "@/interfaces/program-attendance";
import { SessionsExportFormat } from "@/interfaces/program-report";
import {
  checkInSession,
  downloadProgramAttendance,
  getProgramAttendance,
  getAttendanceSessions,
  getMyAttendance,
  getSessionQr,
  markSessionAttendance,
  regenerateSessionQr,
  unmarkSessionAttendance,
} from "@/lib/client/program-attendance";
import { backendHttp } from "@/lib/client/backend-http";
import { downloadBackendFile } from "@/lib/client/download";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/client/download", () => ({ downloadBackendFile: vi.fn() }));
vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const workshop = { week: 4, kind: AttendanceSessionKind.Workshop };
const session =
  "/api/coordinator/programs/program-1/attendance/sessions/4/WORKSHOP";

const calls: ClientCall[] = [
  {
    title: "getMyAttendance reads the caller's week",
    call: () => getMyAttendance(),
    method: "get",
    args: ["/api/programs/mine/attendance"],
  },
  {
    title: "checkInSession sends only the scanned token, never who is acting",
    call: () => checkInSession("Ab_-9"),
    method: "post",
    args: ["/api/attendance/check-in", { token: "Ab_-9" }],
  },
  {
    title: "getProgramAttendance reads the whole program without a range",
    call: () => getProgramAttendance("program-1", null),
    method: "get",
    args: [
      "/api/coordinator/programs/program-1/attendance",
      { params: undefined },
    ],
  },
  {
    title: "getProgramAttendance narrows to the chosen days",
    call: () =>
      getProgramAttendance("program-1", { from: "2026-11-09", to: "2026-11-12" }),
    method: "get",
    args: [
      "/api/coordinator/programs/program-1/attendance",
      { params: { from: "2026-11-09", to: "2026-11-12" } },
    ],
  },
  {
    title: "getAttendanceSessions reads the program's sessions",
    call: () => getAttendanceSessions("program-1"),
    method: "get",
    args: ["/api/coordinator/programs/program-1/attendance/sessions"],
  },
  {
    title: "getSessionQr asks for one session's code",
    call: () => getSessionQr("program-1", workshop),
    method: "post",
    args: [`${session}/qr`],
  },
  {
    title: "regenerateSessionQr asks for a new code",
    call: () => regenerateSessionQr("program-1", workshop),
    method: "post",
    args: [`${session}/qr/regenerate`],
  },
  {
    title: "markSessionAttendance marks one participant",
    call: () => markSessionAttendance("program-1", workshop, "user-1"),
    method: "put",
    args: [`${session}/participants/user-1`],
  },
  {
    title: "unmarkSessionAttendance removes one participant's mark",
    call: () => unmarkSessionAttendance("program-1", workshop, "user-1"),
    method: "delete",
    args: [`${session}/participants/user-1`],
  },
];

describe("program attendance requests", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(calls, backendHttp);
});

describe("checkInSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["", "../x", "Ab+/", "A".repeat(65)])(
    "refuses the link %j as not valid without asking the backend",
    async (token) => {
      await expect(checkInSession(token)).rejects.toMatchObject({
        status: 400,
        code: AttendanceErrorCode.QrNotValid,
      });
      expect(backendHttp.post).not.toHaveBeenCalled();
    },
  );

  it("sends a token of the longest kind the backend stores", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue(createMentorResponse({}));

    await checkInSession("A".repeat(64));

    expect(backendHttp.post).toHaveBeenCalledTimes(1);
  });
});

describe("downloadProgramAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks for the file of the chosen days, named as the backend names it", async () => {
    await downloadProgramAttendance("prog/1", {
      range: { from: "2026-11-09", to: "2026-11-12" },
      format: SessionsExportFormat.Csv,
    });

    expect(downloadBackendFile).toHaveBeenCalledWith(
      "/api/coordinator/programs/prog%2F1/attendance/export",
      { from: "2026-11-09", to: "2026-11-12", format: SessionsExportFormat.Csv },
      "katilim-2026-11-09-2026-11-12.csv",
    );
  });

  it("asks for the whole program without a range", async () => {
    await downloadProgramAttendance("prog/1", {
      range: null,
      format: SessionsExportFormat.Xlsx,
    });

    expect(downloadBackendFile).toHaveBeenCalledWith(
      "/api/coordinator/programs/prog%2F1/attendance/export",
      { format: SessionsExportFormat.Xlsx },
      "katilim-tum.xlsx",
    );
  });
});
