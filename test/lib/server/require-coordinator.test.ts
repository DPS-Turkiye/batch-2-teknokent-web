import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { getSessionUser } from "@/lib/session";
import tr from "@/messages/tr.json";

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

describe("requireCoordinatorOrAdminSession (coordinator screens)", () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockReset();
  });

  it("answers 401 without a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const result = await requireCoordinatorOrAdminSession();
    expect(result.ok ? 200 : result.response.status).toBe(401);
  });

  // An admin may open coordinator screens too.
  it.each([
    [UserRole.Coordinator, 200],
    [UserRole.Admin, 200],
    [UserRole.Mentor, 403],
    [UserRole.Mentee, 403],
  ] as const)("%s → %i", async (role, status) => {
    vi.mocked(getSessionUser).mockResolvedValue(as(role));
    const result = await requireCoordinatorOrAdminSession();
    expect(result.ok ? 200 : result.response.status).toBe(status);
  });

  it("refuses with the screen's message by default, or the one the route names", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentor));
    const messageOf = async (
      result: Awaited<ReturnType<typeof requireCoordinatorOrAdminSession>>,
    ): Promise<unknown> =>
      result.ok ? null : ((await result.response.json()) as unknown);

    expect(await messageOf(await requireCoordinatorOrAdminSession())).toEqual({
      code: "FORBIDDEN",
      message: tr.apiErrors.coordinatorsOnlyPage,
    });
    expect(
      await messageOf(
        await requireCoordinatorOrAdminSession("coordinatorsOnlyManage"),
      ),
    ).toEqual({
      code: "FORBIDDEN",
      message: tr.apiErrors.coordinatorsOnlyManage,
    });
  });
});
