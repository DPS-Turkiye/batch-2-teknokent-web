import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { ProgramType } from "@/interfaces/program";
import { SignupRole } from "@/interfaces/signup";
import {
  adminUserTabsOf,
  loginOptionsOf,
  offersLogin,
  programTypesOf,
  signupRolesOf,
} from "@/lib/edition-screens";
import { UserTab } from "@/types/admin-users";
import { LoginOption } from "@/types/edition-screens";

describe("loginOptionsOf", () => {
  it("offers Teknokent e-mail, OTG, sign-up and invite codes, without the ODTÜ login", () => {
    expect(loginOptionsOf(Edition.Teknokent)).toEqual([
      LoginOption.Password,
      LoginOption.Otg,
      LoginOption.SignUp,
      LoginOption.Invite,
    ]);
  });

  it("offers ODTÜ e-mail for seeded staff, the ODTÜ login and sign-up, without OTG or invite codes", () => {
    expect(loginOptionsOf(Edition.Odtu)).toEqual([
      LoginOption.Password,
      LoginOption.Odtu,
      LoginOption.SignUp,
    ]);
  });
});

describe("offersLogin", () => {
  it.each([
    [Edition.Teknokent, LoginOption.Otg, true],
    [Edition.Teknokent, LoginOption.Odtu, false],
    [Edition.Odtu, LoginOption.Odtu, true],
    [Edition.Odtu, LoginOption.Otg, false],
    [Edition.Odtu, LoginOption.Invite, false],
  ])("in %s answers %s → %s", (edition, option, offered) => {
    expect(offersLogin(edition, option)).toBe(offered);
  });
});

describe("signupRolesOf", () => {
  it("lets Teknokent sign up founders and mentors", () => {
    expect(signupRolesOf(Edition.Teknokent)).toEqual([
      SignupRole.Founder,
      SignupRole.Mentor,
    ]);
  });

  it("has no mentor sign-up in ODTÜ, only the founder flow students use for an individual program", () => {
    expect(signupRolesOf(Edition.Odtu)).toEqual([SignupRole.Founder]);
  });
});

describe("programTypesOf", () => {
  it("matches the backend's allowlist for each edition", () => {
    expect(programTypesOf(Edition.Teknokent)).toEqual([
      ProgramType.StartupMentoring,
    ]);
    expect(programTypesOf(Edition.Odtu)).toEqual([
      ProgramType.PeerMentoring,
      ProgramType.OfficeHours,
    ]);
  });

  it("gives every program type to exactly one edition", () => {
    const offered = Object.values(Edition).flatMap(programTypesOf);
    expect([...offered].sort()).toEqual(Object.values(ProgramType).sort());
  });
});

describe("adminUserTabsOf", () => {
  it("shows teams and mentors in Teknokent, students and academics in ODTÜ, coordinators in both", () => {
    expect(adminUserTabsOf(Edition.Teknokent)).toEqual([
      UserTab.Coordinators,
      UserTab.Mentors,
      UserTab.Teams,
    ]);
    expect(adminUserTabsOf(Edition.Odtu)).toEqual([
      UserTab.Coordinators,
      UserTab.Students,
      UserTab.Academics,
    ]);
  });
});
