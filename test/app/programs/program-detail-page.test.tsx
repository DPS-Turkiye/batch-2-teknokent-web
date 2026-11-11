import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import ProgramDetailPage from "@/app/programs/[id]/page";
import { UserRole } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/components/programs/program-detail-view", () => ({
  ProgramDetailView: () => null,
}));
describe("legacy program detail entry", () => {
  it("sends admins to their managed program detail", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      role: UserRole.Admin,
    } as Awaited<ReturnType<typeof getSessionUser>>);
    await expect(
      ProgramDetailPage({ params: Promise.resolve({ id: "p" }) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/admin/programs/p");
  });
  it("keeps mentees and mentors on the program page", async () => {
    vi.mocked(redirect).mockClear();
    vi.mocked(getSessionUser).mockResolvedValue({
      role: UserRole.Mentee,
    } as Awaited<ReturnType<typeof getSessionUser>>);
    await ProgramDetailPage({ params: Promise.resolve({ id: "p" }) });
    expect(redirect).not.toHaveBeenCalled();
  });
});
