import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  UserAccountStatus,
  UserRole,
  type BackendUser,
} from "@/interfaces/session";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

const mockIronSession: {
  user?: unknown;
  issuedAt?: number;
  checkedAt?: number;
  persist?: boolean;
} = {};
let savedSession: Record<string, unknown> & {
  save: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  updateConfig: ReturnType<typeof vi.fn>;
} = { save: vi.fn(), destroy: vi.fn(), updateConfig: vi.fn() };
vi.mock("iron-session", () => ({
  getIronSession: vi.fn().mockImplementation(() => {
    savedSession = {
      ...mockIronSession,
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    };
    return Promise.resolve(savedSession);
  }),
}));

const { fetchUser } = vi.hoisted(() => ({ fetchUser: vi.fn() }));
vi.mock("@/lib/api/accounts", () => ({ fetchUser }));
// Unreachable unless a test says otherwise: the session is kept and nothing is written.
beforeEach(() => {
  fetchUser.mockResolvedValue({ status: 503, data: {} });
});

process.env.SESSION_PASSWORD = "a".repeat(32);

const HOUR_MS = 60 * 60 * 1000;

const {
  ACCOUNT_RECHECK_MS,
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
    mockIronSession.checkedAt = undefined;
    mockIronSession.persist = undefined;
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

  it("returns null when the sign-in time is in the future or not a number", async () => {
    mockIronSession.user = user;
    for (const issuedAt of [Date.now() + HOUR_MS, Number.NaN]) {
      mockIronSession.issuedAt = issuedAt;
      await expect(getSessionUser()).resolves.toBeNull();
    }
  });
});

describe("getSessionUser account re-check", () => {
  const signedIn = toSession(mentee())!;
  const issuedAt = Date.now() - HOUR_MS;

  function account(overrides: Partial<BackendUser> = {}) {
    return {
      status: 200,
      data: mentee({ status: UserAccountStatus.Approved, ...overrides }),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockIronSession.user = signedIn;
    mockIronSession.issuedAt = issuedAt;
    mockIronSession.checkedAt = Date.now() - ACCOUNT_RECHECK_MS;
    mockIronSession.persist = undefined;
  });

  it("does not ask the backend again within the re-check window", async () => {
    mockIronSession.checkedAt = Date.now() - ACCOUNT_RECHECK_MS + 60_000;
    await expect(getSessionUser()).resolves.toEqual(signedIn);
    expect(fetchUser).not.toHaveBeenCalled();
  });

  it("keeps a still-approved account and records the check, not a new sign-in", async () => {
    fetchUser.mockResolvedValue(account());
    const before = Date.now();

    await expect(getSessionUser()).resolves.toEqual(signedIn);

    // Well under the backend client's 15 s, so a hung backend can't stall every request.
    expect(fetchUser).toHaveBeenCalledWith(signedIn.userId, 3000);
    expect(savedSession.checkedAt).toBeGreaterThanOrEqual(before);
    expect(savedSession.issuedAt).toBe(issuedAt);
    expect(savedSession.save).toHaveBeenCalledOnce();
    expect(savedSession.destroy).not.toHaveBeenCalled();
  });

  it("keeps a remember-me cookie's lifetime when it re-saves", async () => {
    fetchUser.mockResolvedValue(account());
    mockIronSession.persist = true;

    await getSessionUser();

    expect(savedSession.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        cookieOptions: expect.objectContaining({ maxAge: 12 * 60 * 60 }),
      }),
    );
  });

  it("re-checks a session that has never been checked", async () => {
    mockIronSession.checkedAt = undefined;
    fetchUser.mockResolvedValue(account());
    await expect(getSessionUser()).resolves.toEqual(signedIn);
    expect(fetchUser).toHaveBeenCalledOnce();
  });

  it.each([
    ["rejected", { status: UserAccountStatus.Rejected }],
    ["back to pending", { status: UserAccountStatus.Pending }],
    ["given another role", { role: UserRole.Mentor }],
    [
      "moved to another organization",
      { organizationId: "20000000-0000-0000-0000-000000000002" },
    ],
    ["left without an organization", { organizationId: null }],
  ])("signs out an account %s", async (_, overrides) => {
    fetchUser.mockResolvedValue(account(overrides));

    await expect(getSessionUser()).resolves.toBeNull();

    expect(savedSession.destroy).toHaveBeenCalledOnce();
    expect(savedSession.save).not.toHaveBeenCalled();
  });

  it("signs out an account that no longer exists", async () => {
    fetchUser.mockResolvedValue({ status: 404, data: {} });
    await expect(getSessionUser()).resolves.toBeNull();
    expect(savedSession.destroy).toHaveBeenCalledOnce();
  });

  it("keeps the session unchanged when the backend cannot answer", async () => {
    for (const reply of [
      () => fetchUser.mockResolvedValue({ status: 503, data: {} }),
      () => fetchUser.mockRejectedValue(new Error("timeout")),
    ]) {
      reply();
      await expect(getSessionUser()).resolves.toEqual(signedIn);
      expect(savedSession.save).not.toHaveBeenCalled();
      expect(savedSession.destroy).not.toHaveBeenCalled();
    }
  });

  it("logs a refused service credential, which turns the check off for everyone", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const status of [401, 403]) {
      fetchUser.mockResolvedValue({ status, data: {} });
      await expect(getSessionUser()).resolves.toEqual(signedIn);
      expect(log).toHaveBeenLastCalledWith(
        "Account re-check refused by the backend",
        { status },
      );
    }
    log.mockRestore();
  });

  it("still signs out where cookies are read-only (server components)", async () => {
    fetchUser.mockResolvedValue(
      account({ status: UserAccountStatus.Rejected }),
    );
    const { getIronSession } = await import("iron-session");
    vi.mocked(getIronSession).mockImplementationOnce(() => {
      savedSession = {
        ...mockIronSession,
        save: vi.fn(),
        destroy: vi.fn(() => {
          throw new Error("Cookies can only be modified in a Route Handler");
        }),
        updateConfig: vi.fn(),
      };
      return Promise.resolve(savedSession) as never;
    });

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
    expect(savedSession.checkedAt).toBe(savedSession.issuedAt);
    expect(savedSession.persist).toBe(true);
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
