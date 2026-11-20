import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { UserRole } from "@/interfaces/session";
import {
  accountDeletedHref,
  asksForSelfDeletion,
  confirmsAccountDeletion,
  confirmsStartupDeletion,
  RECENT_SIGN_IN_MS,
  saysAccountDeleted,
  signedInRecently,
} from "@/lib/self-deletion";

describe("confirmsAccountDeletion", () => {
  it.each(["SİL", "sil", "Sil", "SIL", "  SİL  "])("accepts %j", (typed) => {
    expect(confirmsAccountDeletion(typed)).toBe(true);
  });

  it.each(["", "SILL", "DELETE", "S İ L", "SİLİN"])("refuses %j", (typed) => {
    expect(confirmsAccountDeletion(typed)).toBe(false);
  });
});

describe("confirmsStartupDeletion", () => {
  it("wants the exact name, apart from surrounding spaces", () => {
    expect(confirmsStartupDeletion(" Döngü Labs ", "Döngü Labs")).toBe(true);
    expect(confirmsStartupDeletion("döngü labs", "Döngü Labs")).toBe(false);
    expect(confirmsStartupDeletion("Dongu Labs", "Döngü Labs")).toBe(false);
    expect(confirmsStartupDeletion("  ", "  ")).toBe(false);
    expect(
      confirmsStartupDeletion("Döngü Labs".normalize("NFD"), "Döngü Labs"),
    ).toBe(true);
  });
});

describe("signedInRecently", () => {
  const now = new Date("2026-11-20T09:00:00Z");

  it("counts a sign-in inside the window and nothing older or unknown", () => {
    expect(
      signedInRecently(new Date(now.getTime() - RECENT_SIGN_IN_MS), now),
    ).toBe(true);
    expect(
      signedInRecently(new Date(now.getTime() - RECENT_SIGN_IN_MS - 1), now),
    ).toBe(false);
    expect(signedInRecently(null, now)).toBe(false);
    expect(signedInRecently(new Date("not a date"), now)).toBe(false);
  });
});

describe("asksForSelfDeletion", () => {
  it("asks for mentees and mentors of the Teknokent edition only", () => {
    expect(asksForSelfDeletion({ role: UserRole.Mentee })).toBe(true);
    expect(asksForSelfDeletion({ role: UserRole.Mentor })).toBe(true);
    expect(
      asksForSelfDeletion({ role: UserRole.Mentee, edition: Edition.Odtu }),
    ).toBe(false);
    expect(asksForSelfDeletion({ role: UserRole.Coordinator })).toBe(false);
    expect(asksForSelfDeletion({ role: UserRole.Admin })).toBe(false);
    expect(
      asksForSelfDeletion({
        role: UserRole.Mentor,
        permissions: [UserRole.Mentor, UserRole.Coordinator],
      }),
    ).toBe(false);
    expect(asksForSelfDeletion(null)).toBe(false);
  });
});

describe("the landing page notice", () => {
  it("reads back the address an account deletion ends on", () => {
    const href = accountDeletedHref();

    expect(href.startsWith("/?")).toBe(true);
    expect(saysAccountDeleted(href.slice(1))).toBe(true);
    expect(saysAccountDeleted("")).toBe(false);
    expect(saysAccountDeleted("?hesap=var")).toBe(false);
  });
});
