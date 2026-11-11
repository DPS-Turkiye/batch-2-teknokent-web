import { beforeEach, describe, expect, it, vi } from "vitest";

import { Workspace } from "@/interfaces/workspace";
import {
  createSession,
  fetchAccountStatus,
  getProgramEligibility,
  refreshSession,
  registerFounder,
  registerMember,
  registerMentor,
  saveLanguage,
  switchWorkspace,
} from "@/lib/client/auth";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";
import { Locale } from "@/lib/i18n";
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
vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));

const BEARER = { headers: { Authorization: "Bearer given-token" } };
const SIGNED_IN = { headers: { Authorization: "Bearer firebase-token" } };

const founder = { fullName: "Ada Kaya", email: "ada@acme.test" };

const calls: ClientCall[] = [
  {
    title:
      "getProgramEligibility asks about the encoded program with the given token",
    call: () => getProgramEligibility("prog 1&x", "given-token"),
    method: "get",
    args: [
      "/api/auth/register/program-eligibility?programId=prog%201%26x",
      BEARER,
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
    args: ["/api/auth/status", BEARER],
  },
  {
    title: "createSession asks for a session that is not remembered by default",
    call: () => createSession("given-token"),
    method: "post",
    args: ["/api/session", { rememberMe: false }, BEARER],
  },
  {
    title: "createSession asks for a remembered session when told to",
    call: () => createSession("given-token", true),
    method: "post",
    args: ["/api/session", { rememberMe: true }, BEARER],
  },
  {
    title: "switchWorkspace posts the workspace on the cookie session",
    call: () => switchWorkspace(Workspace.OdtuStudent),
    method: "post",
    args: ["/api/session/workspace", { workspace: Workspace.OdtuStudent }],
  },
  {
    title: "saveLanguage puts the language with the signed-in user's token",
    call: () => saveLanguage(Locale.En),
    method: "put",
    args: ["/api/session/language", { language: Locale.En }, SIGNED_IN],
    returnsNothing: true,
  },
  {
    title:
      "refreshSession re-reads the session with the signed-in user's token",
    call: () => refreshSession(),
    method: "post",
    args: ["/api/session/refresh", {}, SIGNED_IN],
  },
];

describe("auth client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentIdToken).mockResolvedValue("firebase-token");
  });

  itSendsEachClientCall(calls);

  describe("signed out", () => {
    beforeEach(() => {
      vi.mocked(currentIdToken).mockResolvedValue(null);
    });

    it("saveLanguage sends nothing when there is nobody to save it for", async () => {
      await expect(saveLanguage(Locale.Tr)).resolves.toBeUndefined();

      expect(httpClient.put).not.toHaveBeenCalled();
    });

    it("refreshSession answers null without asking the server", async () => {
      await expect(refreshSession()).resolves.toBeNull();

      expect(httpClient.post).not.toHaveBeenCalled();
    });
  });
});
