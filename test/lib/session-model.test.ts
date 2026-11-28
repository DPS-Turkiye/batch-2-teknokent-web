import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { IdentityKind, UserRole, type BackendUser } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import {
  toSession as toSessionUnder,
  withWorkspace,
} from "@/lib/session-model";

/** Under the Teknokent edition unless a test names another. */
function toSession(user: BackendUser, edition: Edition = Edition.Teknokent) {
  return toSessionUnder(user, edition);
}

function mentee(overrides: Partial<BackendUser> = {}): BackendUser {
  return {
    id: "10000000-0000-0000-0000-000000000001",
    email: "mentee@teknokent.demo",
    fullName: "Deniz Arslan",
    role: UserRole.Mentee,
    organizationId: "20000000-0000-0000-0000-000000000001",
    organizationName: "GreenLoop",
    jobTitle: "Kurucu",
    ...overrides,
  };
}

function mentor(overrides: Partial<BackendUser> = {}): BackendUser {
  return {
    id: "00000000-0000-0000-0000-000000000006",
    email: "ece.demir@teknokent.demo",
    fullName: "Ece Demir",
    role: UserRole.Mentor,
    ...overrides,
  };
}

describe("toSession", () => {
  it("stamps the session with the edition it is read under, never one the account claims", () => {
    expect(
      toSession(mentee({ edition: Edition.Odtu }), Edition.Teknokent)?.edition,
    ).toBe(Edition.Teknokent);
    expect(toSession(mentee(), Edition.Odtu)?.edition).toBe(Edition.Odtu);
  });

  it("builds a mentee session when organization info is present", () => {
    const session = toSession(mentee());
    expect(session).toMatchObject({
      role: UserRole.Mentee,
      organizationId: "20000000-0000-0000-0000-000000000001",
      organizationName: "GreenLoop",
    });
  });

  it("keeps the sign-in flag of an individual program's student", () => {
    expect(
      toSession(mentee({ individualMentee: true }))?.individualMentee,
    ).toBe(true);
    expect(toSession(mentee())?.individualMentee).toBeUndefined();
  });

  it("keeps an ODTÜ student's personal team by id only, flagged, with no name", () => {
    const session = toSession(
      mentee({
        organizationId: "personal-1",
        organizationName: null,
        personalOrganization: true,
        permissions: [UserRole.Mentee],
        institutionKinds: [IdentityKind.Student],
      }),
    );
    expect(session).toMatchObject({
      organizationId: "personal-1",
      personalOrganization: true,
    });
    expect(session?.organizationName).toBeUndefined();
    expect(toSession(mentee())?.personalOrganization).toBeUndefined();
  });

  it("keeps the team of a research assistant, who is mentored but not primarily a mentee", () => {
    const session = toSession(
      mentor({
        role: UserRole.Academician,
        jobTitle: null,
        organizationId: "personal-2",
        organizationName: null,
        personalOrganization: true,
        permissions: [UserRole.Mentee, UserRole.Academician],
        institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
      }),
    );
    expect(session).toMatchObject({
      organizationId: "personal-2",
      personalOrganization: true,
    });
  });

  it("signs in a mentee who has no startup yet", () => {
    const session = toSession(
      mentee({ organizationId: null, organizationName: null }),
    );
    expect(session).not.toBeNull();
    expect(session?.organizationId).toBeUndefined();
  });

  it("signs in an ODTÜ academician and keeps what the institution says they are", () => {
    const session = toSession(
      mentor({
        role: UserRole.Academician,
        jobTitle: null,
        permissions: [UserRole.Mentee, UserRole.Academician],
        institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
      }),
    );
    expect(session).toMatchObject({
      role: UserRole.Academician,
      jobTitle: "Akademisyen",
      permissions: [UserRole.Mentee, UserRole.Academician],
      institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
    });
  });

  it("builds a mentor session without requiring an organization", () => {
    const session = toSession(mentor());
    expect(session).toEqual({
      userId: "00000000-0000-0000-0000-000000000006",
      email: "ece.demir@teknokent.demo",
      fullName: "Ece Demir",
      jobTitle: "Mentor",
      role: UserRole.Mentor,
      permissions: [UserRole.Mentor],
      edition: Edition.Teknokent,
    });
  });

  it("builds an admin session without requiring an organization", () => {
    expect(
      toSession(
        mentee({
          role: UserRole.Admin,
          organizationId: null,
          organizationName: null,
          jobTitle: null,
        }),
      ),
    ).toEqual({
      userId: "10000000-0000-0000-0000-000000000001",
      email: "mentee@teknokent.demo",
      fullName: "Deniz Arslan",
      jobTitle: "Admin",
      role: UserRole.Admin,
      permissions: [UserRole.Admin],
      edition: Edition.Teknokent,
    });
  });

  it("builds a coordinator session without requiring an organization", () => {
    expect(
      toSession(
        mentee({
          role: UserRole.Coordinator,
          organizationId: null,
          organizationName: null,
          jobTitle: null,
        }),
      ),
    ).toEqual({
      userId: "10000000-0000-0000-0000-000000000001",
      email: "mentee@teknokent.demo",
      fullName: "Deniz Arslan",
      jobTitle: "Koordinatör",
      role: UserRole.Coordinator,
      permissions: [UserRole.Coordinator],
      edition: Edition.Teknokent,
    });
  });
});

describe("withWorkspace", () => {
  const assistant = mentor({
    role: UserRole.Academician,
    permissions: [UserRole.Mentee, UserRole.Academician],
    institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
  });

  it("opens a workspace the account can open", () => {
    const session = toSession(assistant, Edition.Odtu);
    expect(
      session && withWorkspace(session, Workspace.OdtuStudent),
    ).toMatchObject({
      activeWorkspace: Workspace.OdtuStudent,
    });
  });

  it("opens no ODTÜ workspace in the Teknokent edition", () => {
    const session = toSession(assistant, Edition.Teknokent);
    expect(session && withWorkspace(session, Workspace.OdtuStudent)).toBeNull();
  });

  it("refuses a workspace the account cannot open", () => {
    const session = toSession(assistant, Edition.Odtu);
    expect(session && withWorkspace(session, Workspace.Admin)).toBeNull();
  });
});
