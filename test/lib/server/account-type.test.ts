import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountType } from "@/interfaces/account-type";
import {
  IdentityKind,
  UserRole,
  type AppSession,
  type SessionData,
} from "@/interfaces/session";
import { ACCOUNT_TYPE_COOKIE } from "@/lib/account-type";
import { getAccountType } from "@/lib/server/account-type";
import { getSessionStore } from "@/lib/session";

const cookieValues = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
  })),
}));
vi.mock("@/lib/session", () => ({ getSessionStore: vi.fn() }));

/** The cookie session getSessionStore opens, holding `data`. */
function sessionStore(
  data: SessionData = {},
): Awaited<ReturnType<typeof getSessionStore>> {
  return { ...data, save: vi.fn(), destroy: vi.fn(), updateConfig: vi.fn() };
}

function signedIn(institutionKinds?: IdentityKind[], role = UserRole.Mentee) {
  const user: AppSession = {
    userId: "u-1",
    email: "ayse@odtu-dev.invalid",
    fullName: "Ayşe",
    jobTitle: "Mentee",
    role,
  };
  if (institutionKinds !== undefined) user.institutionKinds = institutionKinds;
  vi.mocked(getSessionStore).mockResolvedValue(
    sessionStore({ user, issuedAt: Date.now() }),
  );
}

describe("getAccountType", () => {
  beforeEach(() => {
    cookieValues.clear();
    vi.mocked(getSessionStore).mockResolvedValue(sessionStore());
  });

  it("follows the signed-in account, not the preview cookie", async () => {
    cookieValues.set(ACCOUNT_TYPE_COOKIE, AccountType.Odtu);
    signedIn();
    await expect(getAccountType()).resolves.toBe(AccountType.Teknokent);

    cookieValues.clear();
    signedIn([IdentityKind.Academic], UserRole.Academician);
    await expect(getAccountType()).resolves.toBe(AccountType.Odtu);
  });

  it("uses the cookie only while nobody is signed in", async () => {
    await expect(getAccountType()).resolves.toBe(AccountType.Teknokent);
    cookieValues.set(ACCOUNT_TYPE_COOKIE, AccountType.Odtu);
    await expect(getAccountType()).resolves.toBe(AccountType.Odtu);
  });
});
