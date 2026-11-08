import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeUser = {
  email: string;
  emailVerified: boolean;
  reload: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

const auth = vi.hoisted(() => ({ currentUser: null as FakeUser | null }));

vi.mock("@/lib/firebase/client", () => ({ firebaseAuth: () => auth }));

import { reloadAndCheckEmailVerified } from "@/lib/firebase/auth";

function user(verifiedAfterReload: boolean): FakeUser {
  const fake: FakeUser = {
    email: "ayse@startup.com",
    emailVerified: false,
    reload: vi.fn(async () => {
      fake.emailVerified = verifiedAfterReload;
    }),
    getIdToken: vi.fn(async () => "token"),
  };
  return fake;
}

describe("reloadAndCheckEmailVerified", () => {
  beforeEach(() => {
    auth.currentUser = null;
  });

  it("refreshes the ID token once the address is verified, so the backend sees the new claim", async () => {
    const verified = user(true);
    auth.currentUser = verified;

    await expect(reloadAndCheckEmailVerified()).resolves.toBe(true);
    expect(verified.getIdToken).toHaveBeenCalledWith(true);
  });

  it("leaves the token alone while the address is still unverified", async () => {
    const unverified = user(false);
    auth.currentUser = unverified;

    await expect(reloadAndCheckEmailVerified()).resolves.toBe(false);
    expect(unverified.getIdToken).not.toHaveBeenCalled();
  });
});
