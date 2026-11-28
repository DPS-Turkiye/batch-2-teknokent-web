import { beforeEach, describe, vi } from "vitest";

import {
  requestPasswordResetEmail,
  requestVerificationEmail,
} from "@/lib/client/auth-email";
import { backendHttp } from "@/lib/client/backend-http";
import { checkInviteCode } from "@/lib/client/invite-code";
import {
  chooseMentorPrograms,
  getMentorPrograms,
} from "@/lib/client/mentor-programs";
import { itSendsEachClientCall } from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const TOKEN = { headers: { Authorization: "Bearer id-token" } };

describe("sign-up clients that call the backend before any session exists", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(
    [
      {
        title: "requestVerificationEmail mails the token's own address",
        call: () => requestVerificationEmail("id-token"),
        method: "post",
        args: ["/api/auth/register/verification-email", undefined, TOKEN],
        returnsNothing: true,
      },
      {
        title:
          "requestPasswordResetEmail sends the trimmed address, signed out",
        call: () => requestPasswordResetEmail(" ayse@metu.edu.tr "),
        method: "post",
        args: ["/api/auth/password-reset", { email: "ayse@metu.edu.tr" }],
        returnsNothing: true,
      },
      {
        title: "checkInviteCode checks the trimmed code, signed out",
        call: () => checkInviteCode(" YLDZ2345 "),
        method: "post",
        args: ["/api/auth/invite-code/check", { code: "YLDZ2345" }],
      },
      {
        title: "getMentorPrograms reads the mentor's programs with the token",
        call: () => getMentorPrograms("id-token"),
        method: "get",
        args: ["/api/onboarding/mentor-programs", TOKEN],
      },
      {
        title: "chooseMentorPrograms saves the choice with the token",
        call: () => chooseMentorPrograms(["p-1"], "id-token"),
        method: "put",
        args: [
          "/api/onboarding/mentor-programs",
          { programIds: ["p-1"] },
          TOKEN,
        ],
      },
    ],
    backendHttp,
  );
});
