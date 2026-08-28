import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole, type BackendUser } from "@/interfaces/session";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

const mockIronSession: { user?: unknown } = {};
vi.mock("iron-session", () => ({
  getIronSession: vi.fn().mockImplementation(() =>
    Promise.resolve({
      ...mockIronSession,
      save: vi.fn(),
      destroy: vi.fn(),
    }),
  ),
}));

process.env.SESSION_PASSWORD = "a".repeat(32);

const { getSessionIds, getSessionMentorId, getSessionUser, toSession } =
  await import("@/lib/session");
const { SessionRequiredError } = await import("@/lib/server/session-error");

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
  it("builds a mentee session when organization info is present", () => {
    const session = toSession(mentee());
    expect(session).toMatchObject({
      role: UserRole.Mentee,
      organizationId: "20000000-0000-0000-0000-000000000001",
      organizationName: "GreenLoop",
    });
  });

  it("rejects a mentee with no organization", () => {
    expect(
      toSession(mentee({ organizationId: null, organizationName: null })),
    ).toBeNull();
  });

  it("builds a mentor session without requiring an organization", () => {
    const session = toSession(mentor());
    expect(session).toEqual({
      userId: "00000000-0000-0000-0000-000000000006",
      email: "ece.demir@teknokent.demo",
      fullName: "Ece Demir",
      jobTitle: "Mentor",
      role: UserRole.Mentor,
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
      jobTitle: "Koordinatör",
      role: UserRole.Admin,
    });
  });
});

describe("getSessionUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIronSession.user = undefined;
  });

  it("returns null when the session cookie is missing", async () => {
    await expect(getSessionUser()).resolves.toBeNull();
  });
});

describe("getSessionIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIronSession.user = undefined;
  });

  it("throws when the session cookie is missing", async () => {
    await expect(getSessionIds()).rejects.toBeInstanceOf(SessionRequiredError);
  });

  it("returns the cookie's user and organization, not a demo account", async () => {
    mockIronSession.user = {
      userId: "founder-1",
      role: UserRole.Mentee,
      organizationId: "org-1",
    };

    await expect(getSessionIds()).resolves.toEqual({
      userId: "founder-1",
      organizationId: "org-1",
    });
  });
});

describe("getSessionMentorId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIronSession.user = undefined;
  });

  it("returns the session's own mentor id for a mentor session", async () => {
    mockIronSession.user = {
      userId: "00000000-0000-0000-0000-000000000012",
      role: UserRole.Mentor,
    };

    await expect(getSessionMentorId()).resolves.toBe(
      "00000000-0000-0000-0000-000000000012",
    );
  });

  it("throws when there is no mentor session", async () => {
    await expect(getSessionMentorId()).rejects.toBeInstanceOf(
      SessionRequiredError,
    );
  });
});
