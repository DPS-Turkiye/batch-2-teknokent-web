import { describe, expect, it } from "vitest";

import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { canOfferDeletion, confirmsDeletion } from "@/lib/user-deletion";

const mentee = {
  id: "user-1",
  role: UserRole.Mentee,
  status: UserAccountStatus.Approved,
};

describe("canOfferDeletion", () => {
  it.each([
    ["another non-admin account", mentee, "admin-1", true],
    ["nobody signed in", mentee, null, false],
    ["the viewer's own account", mentee, "user-1", false],
    ["an admin", { ...mentee, role: UserRole.Admin }, "admin-1", false],
    [
      "an account that is already deleted",
      { ...mentee, status: UserAccountStatus.Deleted },
      "admin-1",
      false,
    ],
  ])("%s → %s", (_case, person, viewerId, expected) => {
    expect(canOfferDeletion(person, viewerId)).toBe(expected);
  });
});

describe("confirmsDeletion", () => {
  it.each([
    ["the exact address", "ayse@example.com", true],
    ["other case and spaces", "  Ayse@Example.COM ", true],
    ["another address", "ayse@example.org", false],
    ["nothing typed", "   ", false],
  ])("%s → %s", (_case, typed, expected) => {
    expect(confirmsDeletion(typed, "ayse@example.com")).toBe(expected);
  });
});
