import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  currentUser: null as { getIdToken: () => Promise<string> } | null,
  authStateReady: async () => {},
}));

vi.mock("@/lib/firebase/client", () => ({ firebaseAuth: () => auth }));

import { currentIdToken } from "@/lib/firebase/auth";

describe("currentIdToken", () => {
  beforeEach(() => {
    auth.currentUser = null;
    auth.authStateReady = async () => {};
  });

  it("waits for Firebase to restore the saved session after a page load", async () => {
    auth.authStateReady = async () => {
      auth.currentUser = { getIdToken: async () => "restored-token" };
    };

    await expect(currentIdToken()).resolves.toBe("restored-token");
  });

  it("returns null when nobody is signed in", async () => {
    await expect(currentIdToken()).resolves.toBeNull();
  });
});
