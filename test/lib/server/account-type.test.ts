import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountType } from "@/interfaces/account-type";
import { IdentityKind, UserRole } from "@/interfaces/session";
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

function signedIn(institutionKinds?: IdentityKind[], role = UserRole.Mentee) {
  vi.mocked(getSessionStore).mockResolvedValue({
    user: {
      userId: "u-1",
      email: "ayse@odtu-dev.invalid",
      fullName: "Ayşe",
      jobTitle: "Mentee",
      role,
      institutionKinds,
    },
    issuedAt: Date.now(),
  } as Awaited<ReturnType<typeof getSessionStore>>);
}

describe("getAccountType", () => {
  beforeEach(() => {
    cookieValues.clear();
    vi.mocked(getSessionStore).mockResolvedValue(
      {} as Awaited<ReturnType<typeof getSessionStore>>,
    );
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
