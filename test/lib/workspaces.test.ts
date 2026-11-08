import { describe, expect, it } from "vitest";

import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { activeWorkspaceOf, workspacesOf } from "@/lib/workspaces";

function account(
  role: UserRole,
  overrides: Partial<AppSession> = {},
): AppSession {
  return {
    userId: "u-1",
    email: "someone@menton.test",
    fullName: "Someone",
    jobTitle: "x",
    role,
    ...overrides,
  };
}

describe("workspacesOf", () => {
  it("gives a single-role Teknokent account exactly one workspace", () => {
    expect(workspacesOf(account(UserRole.Mentor))).toEqual([
      Workspace.GirisimMentor,
    ]);
    expect(
      workspacesOf(account(UserRole.Mentee, { organizationId: "org-1" })),
    ).toEqual([Workspace.GirisimMentee]);
    expect(workspacesOf(account(UserRole.Admin))).toEqual([Workspace.Admin]);
  });

  // D7: one account, and the academician side opens first.
  it("lets a research assistant switch between academician and student", () => {
    expect(
      workspacesOf(
        account(UserRole.Academician, {
          permissions: [UserRole.Mentee, UserRole.Academician],
          institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
        }),
      ),
    ).toEqual([Workspace.OdtuAcademician, Workspace.OdtuStudent]);
  });

  // D6: an ODTÜ student who is also on a startup team keeps both.
  it("gives a founder who is also an ODTÜ student both workspaces", () => {
    expect(
      workspacesOf(
        account(UserRole.Mentee, {
          organizationId: "org-1",
          institutionKinds: [IdentityKind.Student],
        }),
      ),
    ).toEqual([Workspace.OdtuStudent, Workspace.GirisimMentee]);
  });

  // Peer mentoring is part of the student workspace, and İŞKUR's team of one is not a startup.
  it("keeps an ODTÜ peer mentor in one workspace", () => {
    expect(
      workspacesOf(
        account(UserRole.Mentee, {
          organizationId: "team-of-one",
          individualMentee: true,
          permissions: [UserRole.Mentee, UserRole.Mentor],
          institutionKinds: [IdentityKind.Student],
        }),
      ),
    ).toEqual([Workspace.OdtuStudent]);
  });

  it("opens nothing for an account that holds no permission", () => {
    expect(
      workspacesOf(
        account(UserRole.Mentee, {
          permissions: [],
          institutionKinds: [IdentityKind.Staff],
        }),
      ),
    ).toEqual([]);
  });
});

describe("activeWorkspaceOf", () => {
  const assistant = account(UserRole.Academician, {
    permissions: [UserRole.Mentee, UserRole.Academician],
    institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
  });

  it("keeps the chosen workspace and falls back once the account lost it", () => {
    expect(activeWorkspaceOf(assistant)).toBe(Workspace.OdtuAcademician);
    expect(
      activeWorkspaceOf({
        ...assistant,
        activeWorkspace: Workspace.OdtuStudent,
      }),
    ).toBe(Workspace.OdtuStudent);
    expect(
      activeWorkspaceOf({ ...assistant, activeWorkspace: Workspace.Admin }),
    ).toBe(Workspace.OdtuAcademician);
  });
});
