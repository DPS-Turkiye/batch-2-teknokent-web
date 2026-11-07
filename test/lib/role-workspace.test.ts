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
    });
    expect(roleWorkspace(UserRole.Coordinator)).toMatchObject({
      homeHref: "/coordinator",
      profileHref: "/coordinator",
      notificationsHref: "/coordinator",
      showNotificationBadge: false,
    });
    expect(roleWorkspace(UserRole.Mentor)).toMatchObject({
      homeHref: "/mentor-dashboard",
      profileHref: "/mentor-profile",
      notificationsHref: "/mentor-dashboard#notifications",
    });
    expect(roleWorkspace(UserRole.Mentee)).toMatchObject({
      homeHref: "/dashboard",
      profileHref: "/profile/personal",
      notificationsHref: "/dashboard#notifications",
    });
  });
});

describe("workspaceForSession", () => {
  it("resolves the session's role to its workspace", () => {
    expect(workspaceForSession(session(UserRole.Coordinator)).homeHref).toBe(
      "/coordinator",
    );
    expect(workspaceForSession(null).homeHref).toBe("/dashboard");
  });
});
