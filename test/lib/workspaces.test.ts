import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
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
          edition: Edition.Odtu,
        }),
      ),
    ).toEqual([Workspace.OdtuAcademician, Workspace.OdtuStudent]);
  });

  // D6 is retired (T4): each deployment opens only its own side of an account that holds both.
  it("opens only the Girişim side of an ODTÜ student's startup in the Teknokent edition", () => {
    const founder = {
      organizationId: "org-1",
      institutionKinds: [IdentityKind.Student],
    };
    expect(workspacesOf(account(UserRole.Mentee, founder))).toEqual([
      Workspace.GirisimMentee,
    ]);
    expect(
      workspacesOf(
        account(UserRole.Mentee, { ...founder, edition: Edition.Teknokent }),
      ),
    ).toEqual([Workspace.GirisimMentee]);
    expect(
      workspacesOf(
        account(UserRole.Mentee, { ...founder, edition: Edition.Odtu }),
      ),
    ).toEqual([Workspace.OdtuStudent, Workspace.GirisimMentee]);
  });

  it("opens no ODTÜ workspace in the Teknokent edition", () => {
    expect(
      workspacesOf(
        account(UserRole.Academician, {
          permissions: [UserRole.Mentee, UserRole.Academician],
          institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
          edition: Edition.Teknokent,
        }),
      ),
    ).toEqual([]);
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
          edition: Edition.Odtu,
        }),
      ),
    ).toEqual([Workspace.OdtuStudent]);
  });

  // An ODTÜ student's hidden team of one (their personal team) is no startup either.
  it("opens no Girişim workspace for an ODTÜ student's personal team", () => {
    expect(
      workspacesOf(
        account(UserRole.Mentee, {
          organizationId: "personal-1",
          personalOrganization: true,
          permissions: [UserRole.Mentee],
          institutionKinds: [IdentityKind.Student],
          edition: Edition.Odtu,
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
    edition: Edition.Odtu,
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
