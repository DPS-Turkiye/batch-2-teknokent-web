import { beforeEach, describe, vi } from "vitest";

import { POST as attendanceRoute } from "@/app/api/attendance/check-in/route";
import { POST as passwordResetRoute } from "@/app/api/auth/password-reset/route";
import { POST as registerRoute } from "@/app/api/auth/register/[role]/route";
import { POST as addBotRoute } from "@/app/api/botapi/route";
import { PUT as onboardingDraftRoute } from "@/app/api/onboarding/draft/route";
import { POST as decideInvitationRoute } from "@/app/api/programs/[id]/invitations/decide/route";
import { PUT as activeProgramRoute } from "@/app/api/programs/mine/active/route";
import { POST as createProgramRoute } from "@/app/api/programs/route";
import { PUT as languageRoute } from "@/app/api/session/language/route";
import { PATCH as accountStatusRoute } from "@/app/api/users/[id]/status/route";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import * as accounts from "@/lib/api/accounts";
import * as auth from "@/lib/api/auth";
import * as authEmail from "@/lib/api/auth-email";
import * as onboardingDraft from "@/lib/api/onboarding-draft";
import * as attendance from "@/lib/api/program-attendance";
import * as programs from "@/lib/api/programs";
import * as botapi from "@/lib/botapi";
import { Locale } from "@/lib/i18n";
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
vi.mock("@/lib/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/auth")>()),
  registerAccount: vi.fn(),
  saveSignedInLanguage: vi.fn(),
}));
vi.mock("@/lib/api/auth-email");
vi.mock("@/lib/api/onboarding-draft");
vi.mock("@/lib/api/program-attendance");
vi.mock("@/lib/api/programs");
vi.mock("@/lib/botapi");
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
    route: "POST /api/auth/register/[role]",
    token: "id-token",
    send: (request) =>
      registerRoute(request, { params: Promise.resolve({ role: "mentor" }) }),
    valid: { fullName: "Nihan", email: "nihan@menton.test" },
    backend: auth.registerAccount,
    expected: [
      "mentor",
      { fullName: "Nihan", email: "nihan@menton.test" },
      "id-token",
      null,
    ],
    invalid: { "an array": [], "a string": '"nihan"' },
  },
  {
    route: "PUT /api/session/language",
    method: "PUT",
    token: "id-token",
    send: (request) => languageRoute(request),
    valid: { language: "en" },
    backend: auth.saveSignedInLanguage,
    expected: ["id-token", Locale.En],
    invalid: { "an unknown language": { language: "de" } },
  },
  {
    route: "POST /api/auth/password-reset",
    send: (request) => passwordResetRoute(request),
    valid: { email: " ayse@metu.edu.tr " },
    backend: authEmail.sendPasswordResetEmail,
    expected: ["ayse@metu.edu.tr"],
    invalid: { "a blank address": { email: "  " }, "no address": {} },
  },
  {
    route: "PUT /api/onboarding/draft",
    method: "PUT",
    token: "id-token",
    send: (request) => onboardingDraftRoute(request),
    valid: { kind: "mentor-onboarding", step: "profile", payload: { a: 1 } },
    backend: onboardingDraft.saveOnboardingDraft,
    expected: [
      "id-token",
      { kind: "mentor-onboarding", step: "profile", payload: { a: 1 } },
    ],
    invalid: {
      "an unknown kind": { kind: "admin-wizard", step: "x", payload: null },
      "a missing step": { kind: "signup-wizard", payload: null },
    },
  },
  {
    route: "POST /api/botapi",
    send: (request) => addBotRoute(request),
    token: "firebase-token",
    valid: { meetingUrl: " https://meet.google.com/abc-defg-hij " },
    backend: botapi.createMeetingBot,
    expected: [
      { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      "firebase-token",
    ],
    invalid: { "a link that is not a URL": { meetingUrl: "toplantı" } },
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
    answerAllWith200(
      accounts,
      auth,
      authEmail,
      onboardingDraft,
      attendance,
      programs,
      botapi,
    );
  });

  itChecksTheBody(bodyCase);
});
