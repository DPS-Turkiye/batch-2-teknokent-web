import { beforeEach, describe, vi } from "vitest";

import { AttendanceSessionKind } from "@/interfaces/program-attendance";
import {
  checkInSession,
  getAttendanceSessions,
  getMyAttendance,
  getSessionQr,
  markSessionAttendance,
  regenerateSessionQr,
  unmarkSessionAttendance,
} from "@/lib/client/program-attendance";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

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

  itSendsEachClientCall(calls);
});
