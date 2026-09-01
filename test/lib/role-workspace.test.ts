import { describe, expect, it } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import { roleWorkspace, workspaceForSession } from "@/lib/role-workspace";

function session(
  role: UserRole,
  overrides: Partial<AppSession> = {},
): AppSession {
  return {
    userId: "user-1",
    email: "user@teknokent.demo",
    fullName: "Ada Lovelace",
    jobTitle: "Role",
    role,
    ...overrides,
  };
}

describe("roleWorkspace", () => {
  it("sends each role to a single home, profile, and notifications path", () => {
    expect(roleWorkspace(UserRole.Admin)).toMatchObject({
      homeHref: "/admin",
      profileHref: "/admin",
      notificationsHref: "/admin",
      roleLabel: "Admin",
    });
    expect(roleWorkspace(UserRole.Coordinator)).toMatchObject({
      homeHref: "/programs",
      profileHref: "/programs",
      notificationsHref: "/programs",
      roleLabel: "Koordinatör",
      showNotificationBadge: false,
    });
    expect(roleWorkspace(UserRole.Mentor)).toMatchObject({
      homeHref: "/mentor-dashboard",
      profileHref: "/mentor-profile",
      notificationsHref: "/mentor-dashboard#notifications",
      roleLabel: "Mentor",
    });
    expect(roleWorkspace(UserRole.Mentee)).toMatchObject({
      homeHref: "/dashboard",
      profileHref: "/profile",
      notificationsHref: "/dashboard#notifications",
      roleLabel: "Girişim Ekibi",
    });
  });
});

describe("workspaceForSession", () => {
  it("uses the person's name for staff roles and the organization for mentees", () => {
    expect(workspaceForSession(session(UserRole.Coordinator)).title).toBe(
      "Ada Lovelace",
    );
    expect(
      workspaceForSession(
        session(UserRole.Mentee, { organizationName: "NovaMed AI" }),
      ).title,
    ).toBe("NovaMed AI");
    expect(
      workspaceForSession(
        session(UserRole.Mentee, { organizationName: undefined }),
      ).displayOrganization,
    ).toBe("");
  });
});
