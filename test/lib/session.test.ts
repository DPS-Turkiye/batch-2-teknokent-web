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

vi.mock("@/lib/api/accounts", () => ({
  fetchUser: vi.fn(),
  fetchUsers: vi.fn(),
}));

process.env.SESSION_PASSWORD = "a".repeat(32);

const { fetchUser, fetchUsers } = await import("@/lib/api/accounts");
const {
  DEFAULT_MENTOR_ID,
  DEFAULT_USER_ID,
  findSessionByEmail,
  getSessionMentorId,
  toSession,
} = await import("@/lib/session");

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

  it("rejects an admin user", () => {
    expect(toSession(mentee({ role: UserRole.Admin }))).toBeNull();
  });
});

describe("findSessionByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds a matching mentor across both mentee and mentor lookups", async () => {
    vi.mocked(fetchUsers).mockImplementation(async (role) => ({
      data: role === UserRole.Mentor ? [mentor()] : [mentee()],
      headers: {},
      status: 200,
    }));

    const session = await findSessionByEmail("ECE.DEMIR@teknokent.demo");
    expect(session?.role).toBe(UserRole.Mentor);
  });

  it("returns null when no account matches", async () => {
    vi.mocked(fetchUsers).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    await expect(
      findSessionByEmail("nobody@teknokent.demo"),
    ).resolves.toBeNull();
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

  it("falls back to the demo mentor id when there is no mentor session", async () => {
    vi.mocked(fetchUser).mockResolvedValue({
      data: mentee(),
      headers: {},
      status: 200,
    });

    await expect(getSessionMentorId()).resolves.toBe(DEFAULT_MENTOR_ID);
    expect(fetchUser).toHaveBeenCalledWith(DEFAULT_USER_ID);
  });
});
