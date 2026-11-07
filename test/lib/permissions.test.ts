import { describe, expect, it } from "vitest";

import { UserRole } from "@/interfaces/session";
import {
  hasAnyPermission,
  hasPermission,
  permissionsOf,
  samePermissions,
} from "@/lib/permissions";

describe("permissions", () => {
  it("counts the role itself when an older cookie has no permission list", () => {
    expect(permissionsOf({ role: UserRole.Mentor })).toEqual([UserRole.Mentor]);
    expect(hasPermission({ role: UserRole.Mentor }, UserRole.Mentor)).toBe(
      true,
    );
  });

  it("holds every listed permission beside the role", () => {
    const student = {
      role: UserRole.Mentee,
      permissions: [UserRole.Mentee, UserRole.Mentor],
    };

    expect(hasPermission(student, UserRole.Mentor)).toBe(true);
    expect(hasPermission(student, UserRole.Admin)).toBe(false);
    expect(hasAnyPermission(student, [UserRole.Admin, UserRole.Mentor])).toBe(
      true,
    );
  });

  it("does not restore an explicitly removed primary permission", () => {
    const revoked = { role: UserRole.Mentor, permissions: [] };
    expect(permissionsOf(revoked)).toEqual([]);
    expect(hasPermission(revoked, UserRole.Mentor)).toBe(false);
    expect(samePermissions(revoked, { role: UserRole.Mentor })).toBe(false);
  });

  it("holds nothing without a session", () => {
    expect(hasPermission(null, UserRole.Mentee)).toBe(false);
    expect(hasAnyPermission(undefined, [UserRole.Mentee])).toBe(false);
  });

  it("compares permission sets regardless of order", () => {
    expect(
      samePermissions(
        {
          role: UserRole.Mentee,
          permissions: [UserRole.Mentor, UserRole.Mentee],
        },
        {
          role: UserRole.Mentee,
          permissions: [UserRole.Mentee, UserRole.Mentor],
        },
      ),
    ).toBe(true);
    expect(
      samePermissions(
        { role: UserRole.Mentee },
        {
          role: UserRole.Mentee,
          permissions: [UserRole.Mentee, UserRole.Mentor],
        },
      ),
    ).toBe(false);
  });
});
