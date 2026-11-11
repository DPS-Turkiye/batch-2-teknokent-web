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

/** The response the guard turned the caller away with; fails the test when it let them through. */
async function refusal(): Promise<Response> {
  const result = await requireAdminSession();
  if (result.ok) throw new Error("Expected requireAdminSession to refuse");
  return result.response;
}

describe("requireAdminSession", () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockReset();
  });

  it("answers 401 without a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await refusal()).status).toBe(401);
  });

  it.each([UserRole.Coordinator, UserRole.Mentor, UserRole.Mentee] as const)(
    "refuses a %s with 403",
    async (role) => {
      vi.mocked(getSessionUser).mockResolvedValue(as(role));
      const response = await refusal();
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        code: "FORBIDDEN",
      });
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
