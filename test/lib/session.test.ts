import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole, type BackendUser } from "@/interfaces/session";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

const mockIronSession: { user?: unknown; issuedAt?: number } = {};
let savedSession: Record<string, unknown> = {};
vi.mock("iron-session", () => ({
  getIronSession: vi.fn().mockImplementation(() => {
    savedSession = { ...mockIronSession, save: vi.fn(), destroy: vi.fn() };
    return Promise.resolve(savedSession);
  }),
}));

process.env.SESSION_PASSWORD = "a".repeat(32);

const HOUR_MS = 60 * 60 * 1000;

const {
  getSessionIds,
  getSessionMentorId,
  getSessionUser,
  saveSessionUser,
  toSession,
} = await import("@/lib/session");
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
      jobTitle: "Admin",
      role: UserRole.Admin,
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
    });
  });
});

describe("getSessionUser", () => {
  const user = { userId: "founder-1", role: UserRole.Mentee };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIronSession.user = undefined;
    mockIronSession.issuedAt = undefined;
  });

  it("returns null when the session cookie is missing", async () => {
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("returns the user of a session saved within the last 12 hours", async () => {
    mockIronSession.user = user;
    mockIronSession.issuedAt = Date.now() - 11 * HOUR_MS;
    await expect(getSessionUser()).resolves.toEqual(user);
  });

  // The sealed cookie itself never expires, so a copied one would sign in forever.
  it("returns null once the session is 12 hours old", async () => {
    mockIronSession.user = user;
    mockIronSession.issuedAt = Date.now() - 12 * HOUR_MS;
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("returns null for a session saved before sign-in times were recorded", async () => {
    mockIronSession.user = user;
    await expect(getSessionUser()).resolves.toBeNull();
  });
});

describe("saveSessionUser", () => {
  it("records when the session was saved", async () => {
    const before = Date.now();
    await saveSessionUser(
      { userId: "founder-1", role: UserRole.Mentee } as never,
      true,
    );
    expect(savedSession.issuedAt).toBeGreaterThanOrEqual(before);
    expect(savedSession.issuedAt).toBeLessThanOrEqual(Date.now());
    expect(savedSession.save).toHaveBeenCalledOnce();
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
    mockIronSession.issuedAt = Date.now();

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
    mockIronSession.issuedAt = Date.now();

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
