import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import { requireAdminSession } from "@/lib/server/require-admin";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

function as(role: AppSession["role"]): AppSession {
  return {
    userId: `${role}-1`,
    email: "someone@teknokent.demo",
    fullName: "Someone",
    jobTitle: "x",
    role,
  };
}

describe("requireAdminSession", () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockReset();
  });

  it("answers 401 without a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const result = await requireAdminSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it.each([UserRole.Coordinator, UserRole.Mentor, UserRole.Mentee] as const)(
    "refuses a %s with 403",
    async (role) => {
      vi.mocked(getSessionUser).mockResolvedValue(as(role));
      const result = await requireAdminSession();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(403);
        await expect(result.response.json()).resolves.toMatchObject({
          code: "FORBIDDEN",
        });
      }
    },
  );

  it("lets an admin through with their session", async () => {
    const admin = as(UserRole.Admin);
    vi.mocked(getSessionUser).mockResolvedValue(admin);
    await expect(requireAdminSession()).resolves.toEqual({
      ok: true,
      session: admin,
    });
  });
});
