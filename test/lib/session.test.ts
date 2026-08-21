import { describe, expect, it } from "vitest";

import { toSession } from "@/lib/session";
import type { BackendUser } from "@/interfaces/session";
import { SessionRole } from "@/interfaces/session";

function backendUser(overrides: Partial<BackendUser> = {}): BackendUser {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "user@teknokent.demo",
    fullName: "Test User",
    role: "MENTEE",
    organizationId: "10000000-0000-0000-0000-000000000001",
    organizationName: "GreenLoop",
    jobTitle: "Founder",
    ...overrides,
  };
}

describe("toSession", () => {
  it("builds a mentor session without requiring an organization", () => {
    const session = toSession(
      backendUser({
        role: "MENTOR",
        organizationId: null,
        organizationName: null,
        jobTitle: null,
      }),
    );

    expect(session).toEqual({
      userId: "00000000-0000-0000-0000-000000000001",
      email: "user@teknokent.demo",
      fullName: "Test User",
      jobTitle: "Mentor",
      organizationId: undefined,
      organizationName: undefined,
      role: SessionRole.Mentor,
    });
  });

  it("builds a mentee session when an organization is present", () => {
    const session = toSession(backendUser());

    expect(session).toEqual({
      userId: "00000000-0000-0000-0000-000000000001",
      email: "user@teknokent.demo",
      fullName: "Test User",
      jobTitle: "Founder",
      organizationId: "10000000-0000-0000-0000-000000000001",
      organizationName: "GreenLoop",
      role: SessionRole.Mentee,
    });
  });

  it("rejects a mentee with no organization", () => {
    const session = toSession(
      backendUser({ organizationId: null, organizationName: null }),
    );

    expect(session).toBeNull();
  });

  it("rejects roles other than mentee/mentor", () => {
    const session = toSession(backendUser({ role: "ADMIN" }));

    expect(session).toBeNull();
  });
});
