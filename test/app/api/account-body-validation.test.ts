import { beforeEach, describe, vi } from "vitest";

import { POST as attendanceRoute } from "@/app/api/attendance/check-in/route";
import { POST as decideInvitationRoute } from "@/app/api/programs/[id]/invitations/decide/route";
import { PUT as activeProgramRoute } from "@/app/api/programs/mine/active/route";
import { POST as createProgramRoute } from "@/app/api/programs/route";
import { PATCH as accountStatusRoute } from "@/app/api/users/[id]/status/route";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import * as accounts from "@/lib/api/accounts";
import * as attendance from "@/lib/api/program-attendance";
import * as programs from "@/lib/api/programs";
import { requireAdminSession } from "@/lib/server/require-admin";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  requireMentorSession,
  requireStartupSession,
} from "@/lib/server/require-program-access";
import { getSessionIds, getSessionUser } from "@/lib/session";
import {
  answerAllWith200,
  itChecksTheBody,
  type BodyCase,
} from "@test/app/api/body-validation";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/accounts");
vi.mock("@/lib/api/program-attendance");
vi.mock("@/lib/api/programs");
vi.mock("@/lib/server/require-admin");
vi.mock("@/lib/server/require-coordinator");
vi.mock("@/lib/server/require-program-access");
vi.mock("@/lib/session");

const admin = appSession({ userId: "admin-1", role: UserRole.Admin });
const withId = (id: string) => ({ params: Promise.resolve({ id }) });

const cases: BodyCase[] = [
  {
    route: "PATCH /api/users/[id]/status",
    method: "PATCH",
    send: (request) => accountStatusRoute(request, withId("user-9")),
    valid: { status: UserAccountStatus.Approved },
    backend: accounts.decideAccountStatus,
    expected: ["user-9", "admin-1", UserAccountStatus.Approved],
    invalid: {
      "a status that is not a decision": { status: UserAccountStatus.Pending },
      "an unknown status": { status: "BANNED" },
    },
  },
  {
    route: "POST /api/programs",
    send: (request) => createProgramRoute(request),
    valid: { name: "  İŞKUR 2027 " },
    backend: programs.createProgram,
    expected: ["coordinator-1", "İŞKUR 2027"],
    invalid: { "a blank name": { name: " " }, "a name of the wrong type": 7 },
  },
  {
    route: "POST /api/programs/[id]/invitations/decide",
    send: (request) => decideInvitationRoute(request, withId("program-1")),
    valid: { accepted: true },
    backend: programs.decideProgramInvitation,
    expected: ["mentor-1", "program-1", true],
    invalid: { "no decision": {} },
  },
  {
    route: "PUT /api/programs/mine/active",
    method: "PUT",
    send: (request) => activeProgramRoute(request),
    valid: { programId: null },
    backend: programs.updateActiveProgram,
    expected: ["startup-1", null],
    invalid: { "a program id of the wrong type": { programId: 1 } },
  },
  {
    route: "POST /api/attendance/check-in",
    send: (request) => attendanceRoute(request),
    valid: { token: "Ab_-".repeat(10) },
    backend: attendance.checkInSession,
    expected: ["user-1", "Ab_-".repeat(10)],
    invalid: {
      "no token": {},
      "an empty token": { token: "" },
      "a token with a path in it": { token: "../../etc" },
      "a token longer than any code": { token: "A".repeat(65) },
      "a token sent as a number": { token: 7 },
    },
  },
];

describe.each(cases)("$route", (bodyCase) => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: admin,
    });
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    vi.mocked(requireMentorSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "mentor-1", role: UserRole.Mentor }),
    });
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "startup-1" }),
    });
    vi.mocked(getSessionUser).mockResolvedValue(null);
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "",
    });
    answerAllWith200(accounts, attendance, programs);
  });

  itChecksTheBody(bodyCase);
});
