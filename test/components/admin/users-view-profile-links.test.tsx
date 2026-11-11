import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { renderWithQueryClient } from "@test/test-utils";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/users/mentors",
}));

const person = (overrides: Partial<AdminUser>): AdminUser => ({
  id: "u",
  email: "kisi@example.test",
  fullName: "Kişi",
  role: "MENTOR",
  status: "APPROVED",
  organizationId: null,
  organizationName: null,
  jobTitle: null,
  ...overrides,
});

const overview: AdminOverview = {
  programs: [
    {
      id: "program-1",
      name: "Yeşil Program",
      status: ProgramStatus.Active,
      type: ProgramType.StartupMentoring,
      createdAt: "2026-09-01T09:00:00Z",
      coordinatorId: null,
      coordinatorName: null,
      startupCount: 1,
      acceptedMentorCount: 0,
      pendingMentorCount: 0,
      startups: [
        {
          id: "startup-1",
          name: "Pazar Lab",
          sector: null,
          programId: "program-1",
          programName: "Yeşil Program",
        },
      ],
      mentors: [],
    },
  ],
  users: [
    person({ id: "mentor-1", fullName: "Deniz Yıldız" }),
    person({
      id: "mentee-1",
      fullName: "Ece Kaya",
      role: "MENTEE",
      organizationId: "startup-1",
      organizationName: "Pazar Lab",
    }),
  ],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

function rowOf(name: string) {
  return screen
    .getByText(name)
    .closest('div[class*="border-[#f0f2f4]"]') as HTMLElement;
}

describe("UsersView › Profili gör", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens a mentor's profile page from the row menu and from the drawer", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<UsersView tab="mentors" />);

    const row = within(rowOf("Deniz Yıldız"));
    await user.click(row.getByRole("button", { name: "Diğer işlemler" }));
    await user.click(row.getByRole("button", { name: "Profili gör" }));
    expect(navigation.push).toHaveBeenCalledWith("/admin/users/mentor-1");

    await user.click(row.getByRole("button", { name: "Detay" }));
    expect(
      screen.getByRole("link", { name: "Profili gör: Deniz Yıldız" }),
    ).toHaveAttribute("href", "/admin/users/mentor-1");
  });

  it("links every team member to their profile page", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<UsersView tab="teams" />);

    await user.click(
      within(rowOf("Pazar Lab")).getByRole("button", { name: "Detay" }),
    );
    await user.click(screen.getByRole("button", { name: "Ekip" }));

    expect(
      screen.getByRole("link", { name: "Profili gör: Ece Kaya" }),
    ).toHaveAttribute("href", "/admin/users/mentee-1");
  });
});
