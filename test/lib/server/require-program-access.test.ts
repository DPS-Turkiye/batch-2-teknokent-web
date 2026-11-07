import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import {
  requireCoordinatorOrMentorSession,
  requireCoordinatorSession,
  requireMentorSession,
  requireStartupSession,
} from "@/lib/server/require-program-access";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

function as(role: AppSession["role"], organizationId?: string): AppSession {
  return {
    userId: `${role}-1`,
    email: "someone@teknokent.demo",
    fullName: "Someone",
    jobTitle: "x",
    role,
    organizationId,
  };
}

async function statusOf(
  guard: () => Promise<{ ok: boolean; response?: Response }>,
) {
  const result = await guard();
  return result.ok ? 200 : result.response!.status;
}

describe("program access guards", () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockReset();
  });

  it.each([
    requireCoordinatorSession,
    requireMentorSession,
    requireStartupSession,
    requireCoordinatorOrMentorSession,
  ])("%o answers 401 without a session", async (guard) => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect(await statusOf(guard)).toBe(401);
  });

  it("lets a student who also holds the mentor permission through the mentor guard", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      ...as(UserRole.Mentee, "org-1"),
      permissions: [UserRole.Mentor, UserRole.Mentee],
    });
    expect(await statusOf(requireMentorSession)).toBe(200);
    expect(await statusOf(requireStartupSession)).toBe(200);
    expect(await statusOf(requireCoordinatorSession)).toBe(403);
  });

  it.each([
    [UserRole.Coordinator, 200],
    [UserRole.Admin, 403],
    [UserRole.Mentor, 403],
    [UserRole.Mentee, 403],
  ] as const)(
    "requireCoordinatorSession lets only a coordinator through (%s → %i)",
    async (role, status) => {
      vi.mocked(getSessionUser).mockResolvedValue(as(role));
      expect(await statusOf(requireCoordinatorSession)).toBe(status);
    },
  );

  it.each([
    [UserRole.Mentor, 200],
    [UserRole.Coordinator, 403],
    [UserRole.Admin, 403],
    [UserRole.Mentee, 403],
  ] as const)(
    "requireMentorSession lets only a mentor through (%s → %i)",
    async (role, status) => {
      vi.mocked(getSessionUser).mockResolvedValue(as(role));
      expect(await statusOf(requireMentorSession)).toBe(status);
    },
  );

  it("requireStartupSession needs a mentee with an organization", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee, "org-1"));
    expect(await statusOf(requireStartupSession)).toBe(200);

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    expect(await statusOf(requireStartupSession)).toBe(403);

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentor, "org-1"));
    expect(await statusOf(requireStartupSession)).toBe(403);
  });

  it.each([
    [UserRole.Coordinator, 200],
    [UserRole.Mentor, 200],
    [UserRole.Admin, 200],
    [UserRole.Mentee, 403],
  ] as const)(
    "requireCoordinatorOrMentorSession refuses startup members (%s → %i)",
    async (role, status) => {
      vi.mocked(getSessionUser).mockResolvedValue(as(role, "org-1"));
      expect(await statusOf(requireCoordinatorOrMentorSession)).toBe(status);
    },
  );

  it("returns the session it checked", async () => {
    const mentor = as(UserRole.Mentor);
    vi.mocked(getSessionUser).mockResolvedValue(mentor);
    await expect(requireMentorSession()).resolves.toEqual({
      ok: true,
      session: mentor,
    });
  });
});
