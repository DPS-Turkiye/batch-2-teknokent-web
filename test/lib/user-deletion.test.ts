import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { canOfferDeletion, confirmsDeletion } from "@/lib/user-deletion";

const mentee = {
  id: "user-1",
  role: UserRole.Mentee,
  status: UserAccountStatus.Approved,
};

const admin = {
  userId: "admin-1",
  role: UserRole.Admin,
  edition: Edition.Teknokent,
};

describe("canOfferDeletion", () => {
  it.each([
    ["an admin, for another non-admin account", mentee, admin, true],
    [
      "an admin whose session predates editions (reads as Teknokent)",
      mentee,
      { userId: "admin-1", role: UserRole.Admin },
      true,
    ],
    [
      "a coordinator who also holds the admin permission",
      mentee,
      {
        userId: "admin-1",
        role: UserRole.Coordinator,
        permissions: [UserRole.Coordinator, UserRole.Admin],
      },
      true,
    ],
    ["nobody signed in", mentee, null, false],
    ["a coordinator", mentee, { ...admin, role: UserRole.Coordinator }, false],
    ["the ODTÜ edition", mentee, { ...admin, edition: Edition.Odtu }, false],
    ["the viewer's own account", mentee, { ...admin, userId: "user-1" }, false],
    ["an admin's account", { ...mentee, role: UserRole.Admin }, admin, false],
    [
      "an account that is already deleted",
      { ...mentee, status: UserAccountStatus.Deleted },
      admin,
      false,
    ],
  ])("offers deletion to %s → %s", (_case, person, viewer, expected) => {
    expect(canOfferDeletion(person, viewer)).toBe(expected);
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
