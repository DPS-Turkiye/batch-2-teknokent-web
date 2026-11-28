import { beforeEach, describe, vi } from "vitest";

import { POST as addBotRoute } from "@/app/api/botapi/route";
import { UserRole } from "@/interfaces/session";
import * as botapi from "@/lib/botapi";
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

vi.mock("@/lib/botapi");
vi.mock("@/lib/server/require-admin");
vi.mock("@/lib/server/require-coordinator");
vi.mock("@/lib/server/require-program-access");
vi.mock("@/lib/session");

const admin = appSession({ userId: "admin-1", role: UserRole.Admin });

const cases: BodyCase[] = [
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
    answerAllWith200(botapi);
  });

  itChecksTheBody(bodyCase);
});
