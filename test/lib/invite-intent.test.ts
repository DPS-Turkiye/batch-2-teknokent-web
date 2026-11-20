import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearInviteIntent,
  inviteCodeOrNull,
  inviteHref,
  inviteIntentWins,
  inviteLink,
  readInviteIntent,
  saveInviteIntent,
} from "@/lib/invite-intent";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("invite intent", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("builds /invite links with the code, and marks a return", () => {
    expect(inviteHref("ABCD 2345")).toBe("/invite?code=ABCD+2345");
    expect(inviteHref("ABCD2345", true)).toBe("/invite?code=ABCD2345&resume=1");
    expect(inviteLink("https://menton.com.tr", "ABCD2345")).toBe(
      "https://menton.com.tr/invite?code=ABCD2345",
    );
  });

  it("takes only a plausible code from a URL or storage", () => {
    expect(inviteCodeOrNull("  abcd2345 ")).toBe("abcd2345");
    expect(inviteCodeOrNull("")).toBeNull();
    expect(inviteCodeOrNull("   ")).toBeNull();
    expect(inviteCodeOrNull("A".repeat(33))).toBeNull();
    expect(inviteCodeOrNull(42)).toBeNull();
    expect(inviteCodeOrNull(null)).toBeNull();
  });

  it("remembers the code for 30 days, then forgets it", () => {
    saveInviteIntent("ABCD2345", NOW);

    expect(readInviteIntent(NOW + DAY)).toEqual({
      code: "ABCD2345",
      savedAt: NOW,
    });
    expect(readInviteIntent(NOW + 31 * DAY)).toBeNull();

    clearInviteIntent();
    expect(readInviteIntent(NOW)).toBeNull();
  });

  it("ignores what it did not write", () => {
    window.localStorage.setItem("menton.inviteIntent", "not json");
    expect(readInviteIntent(NOW)).toBeNull();
    window.localStorage.setItem("menton.inviteIntent", JSON.stringify([1]));
    expect(readInviteIntent(NOW)).toBeNull();
    window.localStorage.setItem(
      "menton.inviteIntent",
      JSON.stringify({ code: "ABCD2345", savedAt: "yesterday" }),
    );
    expect(readInviteIntent(NOW)).toBeNull();
    window.localStorage.setItem("menton.inviteIntent", "null");
    expect(readInviteIntent(NOW)).toBeNull();
  });

  it("keeps working when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveInviteIntent("ABCD2345", NOW)).not.toThrow();
    expect(readInviteIntent(NOW)).toBeNull();
    expect(() => clearInviteIntent()).not.toThrow();
  });

  describe("inviteIntentWins", () => {
    const intent = { code: "ABCD2345", savedAt: NOW };

    it("needs an intent, and wins without a draft", () => {
      expect(inviteIntentWins(null, null)).toBe(false);
      expect(inviteIntentWins(intent, null)).toBe(true);
    });

    it("never takes a mentor away from their onboarding", () => {
      expect(
        inviteIntentWins(intent, {
          kind: "mentor-onboarding",
          step: "profile",
          payload: {},
          updatedAt: new Date(NOW - DAY).toISOString(),
        }),
      ).toBe(false);
    });

    it("gives way to a founder draft touched after the code was entered", () => {
      const draft = (updatedAt: string | null) => ({
        kind: "signup-wizard" as const,
        step: "2",
        payload: {},
        updatedAt,
      });

      expect(
        inviteIntentWins(intent, draft(new Date(NOW + DAY).toISOString())),
      ).toBe(false);
      expect(
        inviteIntentWins(intent, draft(new Date(NOW - DAY).toISOString())),
      ).toBe(true);
      expect(inviteIntentWins(intent, draft(null))).toBe(true);
    });
  });
});
