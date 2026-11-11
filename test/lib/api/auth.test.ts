import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchProgramEligibility,
  fetchSignedInUser,
  isRegisterRole,
  REGISTER_ROLES,
  registerAccount,
  saveSignedInLanguage,
} from "@/lib/api/auth";
import { Locale } from "@/lib/i18n";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type SignedRequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

// These run before the person has a session, so each is signed with their Firebase token.
const signedCases: SignedRequestCase[] = [
  [
    "asks whether the token's own address may join the program",
    () => fetchProgramEligibility("prog-1", "id-token"),
    {
      method: "GET",
      url: "/api/auth/register/program-eligibility",
      params: { programId: "prog-1" },
    },
  ],
  [
    "registers the account under the role's path",
    () => registerAccount("mentor", { fullName: "Ada" }, "id-token"),
    {
      method: "POST",
      url: "/api/auth/register/mentor",
      data: { fullName: "Ada" },
    },
  ],
  [
    "reads the signed-in user",
    () => fetchSignedInUser("id-token"),
    { method: "GET", url: "/api/auth/me" },
  ],
  [
    "saves the signed-in user's language",
    () => saveSignedInLanguage("id-token", Locale.En),
    {
      method: "PUT",
      url: "/api/auth/me/language",
      data: { language: Locale.En },
    },
  ],
];

describe("auth server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(signedCases)("%s", async (_description, call, request) => {
    await call();
    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      request,
      { idToken: "id-token" },
    ]);
  });

  describe("isRegisterRole", () => {
    it.each(REGISTER_ROLES)("accepts the %s signup path", (role) => {
      expect(isRegisterRole(role)).toBe(true);
    });

    it.each(["admin", "coordinator", "Mentor", ""])(
      "rejects %j so no other role can be registered",
      (value) => {
        expect(isRegisterRole(value)).toBe(false);
      },
    );
  });
});
