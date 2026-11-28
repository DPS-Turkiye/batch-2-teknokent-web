import { describe, expect, it } from "vitest";

import { UserRole } from "@/interfaces/session";
import { roleWorkspace } from "@/lib/role-workspace";
import {
  profileDestination,
  startupPageRedirect,
} from "@/lib/startup-page-gate";
import { STUDENT_PROJECT_HREF } from "@/lib/startup-tabs";
import { appSession } from "@test/fixtures/session";

const member = appSession({ role: UserRole.Mentee, organizationId: "org-1" });
const path = "/startup/profile-tools";

describe("startupPageRedirect", () => {
  it("lets a startup member stay and sends a student of an individual program to Projem", () => {
    for (const strict of [false, true]) {
      expect(
        startupPageRedirect({
          session: member,
          individual: false,
          strict,
          path,
        }),
      ).toBeNull();
      expect(
        startupPageRedirect({
          session: member,
          individual: true,
          strict,
          path,
        }),
      ).toBe(STUDENT_PROJECT_HREF);
    }
  });

  it("keeps a strict page to signed-in mentees with a startup", () => {
    const mentor = appSession({ role: UserRole.Mentor });
    const withoutStartup = appSession({ role: UserRole.Mentee });

    expect(
      startupPageRedirect({
        session: null,
        individual: false,
        strict: true,
        path,
      }),
    ).toBe("/login?next=%2Fstartup%2Fprofile-tools");
    expect(
      startupPageRedirect({
        session: mentor,
        individual: false,
        strict: true,
        path,
      }),
    ).toBe(roleWorkspace(UserRole.Mentor).homeHref);
    expect(
      startupPageRedirect({
        session: withoutStartup,
        individual: false,
        strict: true,
        path,
      }),
    ).toBe("/profile/personal");
    expect(
      startupPageRedirect({
        session: mentor,
        individual: false,
        strict: false,
        path,
      }),
    ).toBeNull();
  });
});

describe("profileDestination", () => {
  it("leads a startup member to the startup's profile tools, on the web when asked", () => {
    expect(
      profileDestination({ session: member, individual: false, web: false }),
    ).toBe("/startup/profile-tools");
    expect(
      profileDestination({ session: member, individual: false, web: true }),
    ).toBe("/startup/profile-tools?web=1");
  });

  it("leads a student of an individual program and other roles to their own profile", () => {
    expect(
      profileDestination({ session: member, individual: true, web: false }),
    ).toBe(roleWorkspace(UserRole.Mentee).profileHref);
    const mentor = appSession({ role: UserRole.Mentor });
    expect(
      profileDestination({ session: mentor, individual: false, web: false }),
    ).toBe(roleWorkspace(UserRole.Mentor).profileHref);
  });

  it("sends someone signed out to the login", () => {
    expect(
      profileDestination({ session: null, individual: false, web: false }),
    ).toBe("/login?next=%2Fprofile");
  });
});
