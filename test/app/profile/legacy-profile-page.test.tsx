import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "@/app/profile/page";
import StartupProfileToolsPage from "@/app/startup/profile-tools/page";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getOrganizationPrograms } from "@/lib/client/programs";
import { appSession } from "@test/fixtures/session";
import { createTestQueryClient } from "@test/test-utils";

const replace = vi.fn();
let searchParams = new URLSearchParams();
let signedIn: AppSession | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: signedIn, isLoading: false }),
  useAppSession: () => signedIn,
}));
vi.mock("@/lib/client/programs", () => ({ getOrganizationPrograms: vi.fn() }));
vi.mock("@/components/startup/startup-profile-tools-view", () => ({
  StartupProfileToolsView: () => <p>profile tools</p>,
}));

function inPrograms(individualMentees: boolean) {
  vi.mocked(getOrganizationPrograms).mockResolvedValue({
    programs: [
      { id: "p1", name: "İŞKUR", coordinatorName: "Elif", individualMentees },
    ],
    activeProgramId: "p1",
  });
}

function show(page: ReactElement) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      {page}
    </QueryClientProvider>,
  );
}

function as(role: UserRole, organizationId: string | null = "org-1") {
  signedIn = appSession({
    role,
    userId: "user-1",
    organizationId: organizationId ?? undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
  inPrograms(false);
});

describe("legacy profile retirement", () => {
  it("redirects old mentee bookmarks directly into the startup feature", async () => {
    as(UserRole.Mentee);
    show(<ProfilePage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/startup/profile-tools"),
    );
  });

  it("sends a student of an individual program to their personal profile", async () => {
    as(UserRole.Mentee);
    inPrograms(true);
    show(<ProfilePage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/profile/personal"),
    );
    show(<StartupProfileToolsPage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/startup/process"),
    );
  });

  it("keeps the explicit mobile web preference", async () => {
    as(UserRole.Mentee);
    searchParams = new URLSearchParams("web=1");
    show(<ProfilePage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/startup/profile-tools?web=1"),
    );
  });

  it.each([
    [UserRole.Mentor, "/mentor-profile"],
    [UserRole.Admin, "/admin"],
    [UserRole.Coordinator, "/coordinator"],
  ])("sends %s to its own current profile", async (role, path) => {
    as(role, null);
    show(<ProfilePage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(path));
  });

  it("requires authentication for the old and new URLs", async () => {
    signedIn = null;
    show(<ProfilePage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?next=%2Fprofile"),
    );
    show(<StartupProfileToolsPage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/login?next=%2Fstartup%2Fprofile-tools",
      ),
    );
  });

  it("does not expose the startup editor to other roles", async () => {
    as(UserRole.Mentor, null);
    show(<StartupProfileToolsPage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/mentor-dashboard"),
    );
    expect(screen.queryByText("profile tools")).toBeNull();
  });

  it("renders for a startup mentee and keeps personal-only accounts in their personal profile", async () => {
    as(UserRole.Mentee);
    show(<StartupProfileToolsPage />);
    expect(await screen.findByText("profile tools")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();

    as(UserRole.Mentee, null);
    show(<StartupProfileToolsPage />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/profile/personal"),
    );
  });
});
