import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "@/app/profile/page";
import StartupProfileToolsPage from "@/app/startup/profile-tools/page";
import { getSessionUser } from "@/lib/session";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchOrganizationPrograms } from "@/lib/api/programs";

vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/programs", () => ({ fetchOrganizationPrograms: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("REDIRECT:" + path);
  },
}));
vi.mock("@/components/startup/startup-profile-tools-view", () => ({
  StartupProfileToolsView: () => null,
}));
function inPrograms(individualMentees: boolean) {
  vi.mocked(fetchOrganizationPrograms).mockResolvedValue({
    status: 200,
    data: {
      programs: [
        { id: "p1", name: "İŞKUR", coordinatorName: "Elif", individualMentees },
      ],
      activeProgramId: "p1",
    },
  } as Awaited<ReturnType<typeof fetchOrganizationPrograms>>);
}
beforeEach(() => {
  vi.clearAllMocks();
  inPrograms(false);
});
function session(role: UserRole) {
  vi.mocked(getSessionUser).mockResolvedValue({
    role,
    userId: "user-1",
    organizationId: "org-1",
  } as AppSession);
}
describe("legacy profile retirement", () => {
  it("redirects old mentee bookmarks directly into the startup feature", async () => {
    session(UserRole.Mentee);
    await expect(
      ProfilePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/startup/profile-tools");
  });
  it("sends a student of an individual program to their personal profile", async () => {
    session(UserRole.Mentee);
    inPrograms(true);
    await expect(
      ProfilePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/profile/personal");
    await expect(StartupProfileToolsPage()).rejects.toThrow(
      "REDIRECT:/startup/process",
    );
  });
  it("keeps the explicit mobile web preference", async () => {
    session(UserRole.Mentee);
    await expect(
      ProfilePage({ searchParams: Promise.resolve({ web: "1" }) }),
    ).rejects.toThrow("REDIRECT:/startup/profile-tools?web=1");
  });
  it.each([
    [UserRole.Mentor, "/mentor-profile"],
    [UserRole.Admin, "/admin"],
    [UserRole.Coordinator, "/coordinator"],
  ])("sends %s to its own current profile", async (role, path) => {
    session(role);
    await expect(
      ProfilePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:" + path);
  });
  it("requires authentication for the old and new URLs", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    await expect(
      ProfilePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/login?next=%2Fprofile");
    await expect(StartupProfileToolsPage()).rejects.toThrow(
      "REDIRECT:/login?next=%2Fstartup%2Fprofile-tools",
    );
  });
  it("does not expose the startup editor to other roles", async () => {
    session(UserRole.Mentor);
    await expect(StartupProfileToolsPage()).rejects.toThrow(
      "REDIRECT:/mentor-dashboard",
    );
  });
  it("renders for a startup mentee and keeps personal-only accounts in their personal profile", async () => {
    session(UserRole.Mentee);
    expect(await StartupProfileToolsPage()).toBeTruthy();
    vi.mocked(getSessionUser).mockResolvedValue({
      role: UserRole.Mentee,
      userId: "solo",
    } as AppSession);
    await expect(StartupProfileToolsPage()).rejects.toThrow(
      "REDIRECT:/profile/personal",
    );
    await expect(
      ProfilePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/profile/personal");
  });
});
