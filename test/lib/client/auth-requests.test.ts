import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchAccountStatus,
  getProgramEligibility,
  registerFounder,
  registerMember,
  registerMentor,
  saveLanguage,
} from "@/lib/client/auth";
import { backendHttp } from "@/lib/client/backend-http";
import { currentIdToken } from "@/lib/firebase/auth";
import { Locale } from "@/lib/i18n";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));
vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const BEARER = { headers: { Authorization: "Bearer given-token" } };
const SIGNED_IN = { headers: { Authorization: "Bearer firebase-token" } };

const founder = { fullName: "Ada Kaya", email: "ada@acme.test" };

const calls: ClientCall[] = [
  {
    title: "getProgramEligibility asks about the program with the given token",
    call: () => getProgramEligibility("prog 1&x", "given-token"),
    method: "get",
    args: [
      "/api/auth/register/program-eligibility",
      { ...BEARER, params: { programId: "prog 1&x" } },
    ],
  },
  {
    title: "registerFounder posts the founder with the given token",
    call: () => registerFounder(founder, "given-token"),
    method: "post",
    args: ["/api/auth/register/founder", founder, BEARER],
  },
  {
    title: "registerMentor posts the mentor with the given token",
    call: () =>
      registerMentor({ ...founder, programInvite: "INV1" }, "given-token"),
    method: "post",
    args: [
      "/api/auth/register/mentor",
      { ...founder, programInvite: "INV1" },
      BEARER,
    ],
  },
  {
    title:
      "registerMember posts the member and invite code with the given token",
    call: () =>
      registerMember({ ...founder, inviteCode: "CODE" }, "given-token"),
    method: "post",
    args: [
      "/api/auth/register/member",
      { ...founder, inviteCode: "CODE" },
      BEARER,
    ],
  },
  {
    title: "fetchAccountStatus reads the account with the given token",
    call: () => fetchAccountStatus("given-token"),
    method: "get",
    args: ["/api/auth/me", BEARER],
  },
  {
    title: "saveLanguage puts the language with the signed-in user's token",
    call: () => saveLanguage(Locale.En),
    method: "put",
    args: ["/api/auth/me/language", { language: Locale.En }, SIGNED_IN],
    returnsNothing: true,
  },
];

describe("auth client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentIdToken).mockResolvedValue("firebase-token");
  });

  itSendsEachClientCall(calls, backendHttp);

  describe("without a Firebase sign-in", () => {
    beforeEach(() => {
      vi.mocked(currentIdToken).mockResolvedValue(null);
    });

    it("saveLanguage saves it on the session cookie", async () => {
      vi.mocked(backendHttp.put).mockResolvedValue(
        createMentorResponse(null, 204),
      );

      await saveLanguage(Locale.Tr);

      expect(backendHttp.put).toHaveBeenCalledWith(
        "/api/auth/me/language",
        { language: Locale.Tr },
        undefined,
      );
    });

    it("saveLanguage is quiet when there is nobody to save it for", async () => {
      vi.mocked(backendHttp.put).mockResolvedValue(
        createMentorResponse({}, 401),
      );

      await expect(saveLanguage(Locale.Tr)).resolves.toBeUndefined();
    });
  });
});
