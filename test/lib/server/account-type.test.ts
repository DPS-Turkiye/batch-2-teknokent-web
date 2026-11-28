import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountType } from "@/interfaces/account-type";
import { ACCOUNT_TYPE_COOKIE } from "@/lib/account-type";
import { getAccountType } from "@/lib/server/account-type";

const cookieValues = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
  })),
}));

describe("getAccountType", () => {
  beforeEach(() => cookieValues.clear());

  // The browser writes the signed-in session's type there (saveAccountTypeCookie); this server cannot see the API's.
  it("follows the cookie, Teknokent when it is missing or unknown", async () => {
    await expect(getAccountType()).resolves.toBe(AccountType.Teknokent);
    cookieValues.set(ACCOUNT_TYPE_COOKIE, AccountType.Odtu);
    await expect(getAccountType()).resolves.toBe(AccountType.Odtu);
    cookieValues.set(ACCOUNT_TYPE_COOKIE, "metu");
    await expect(getAccountType()).resolves.toBe(AccountType.Teknokent);
  });
});
