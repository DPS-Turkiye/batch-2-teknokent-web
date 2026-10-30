import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
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

describe("requireCoordinatorSession (coordinator screens)", () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockReset();
  });

  it("answers 401 without a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const result = await requireCoordinatorSession();
    expect(result.ok ? 200 : result.response.status).toBe(401);
  });

  // Unlike the program guard of the same name, an admin may open coordinator screens.
  it.each([
    [UserRole.Coordinator, 200],
    [UserRole.Admin, 200],
    [UserRole.Mentor, 403],
    [UserRole.Mentee, 403],
  ] as const)("%s → %i", async (role, status) => {
    vi.mocked(getSessionUser).mockResolvedValue(as(role));
    const result = await requireCoordinatorSession();
    expect(result.ok ? 200 : result.response.status).toBe(status);
  });
});
