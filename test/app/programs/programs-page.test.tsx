import { beforeEach, describe, expect, it, vi } from "vitest";

import ProgramsPage from "@/app/programs/page";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("REDIRECT:" + path);
  },
}));

beforeEach(() => vi.clearAllMocks());

describe("old /programs page", () => {
  it.each([
    [UserRole.Coordinator, "/coordinator/programs"],
    [UserRole.Admin, "/admin/programs"],
    [UserRole.Mentor, "/mentor-dashboard"],
    [UserRole.Mentee, "/dashboard"],
  ])("sends %s to its current program screen or home", async (role, path) => {
    vi.mocked(getSessionUser).mockResolvedValue({
      role,
      userId: "user-1",
    } as AppSession);
    await expect(ProgramsPage()).rejects.toThrow("REDIRECT:" + path);
  });

  it("asks a signed-out visitor to log in first", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    await expect(ProgramsPage()).rejects.toThrow(
      "REDIRECT:/login?next=%2Fprograms",
    );
  });
});
