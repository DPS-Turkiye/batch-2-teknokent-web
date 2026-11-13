import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { UserTab } from "@/types/admin-users";
import { adminProgram, adminStartup } from "@test/fixtures/admin-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/users/mentors",
}));

const person = (overrides: Partial<AdminUser>): AdminUser => ({
  id: "u",
  email: "kisi@example.test",
  fullName: "Kişi",
  role: UserRole.Mentor,
  status: UserAccountStatus.Approved,
  organizationId: null,
  organizationName: null,
  jobTitle: null,
  ...overrides,
});

const overview: AdminOverview = {
  programs: [
    adminProgram({
      startupCount: 1,
      startups: [adminStartup({ id: "startup-1", name: "Pazar Lab" })],
    }),
  ],
  users: [
    person({ id: "mentor-1", fullName: "Deniz Yıldız" }),
    person({
      id: "mentee-1",
      fullName: "Ece Kaya",
      role: UserRole.Mentee,
      organizationId: "startup-1",
      organizationName: "Pazar Lab",
    }),
  ],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

// The Mentorlar and Takımlar tabs exist on the Teknokent edition.
vi.mock("@/hooks/use-edition", async () => {
  const { Edition } = await import("@/interfaces/edition");
  return { useEdition: () => Edition.Teknokent };
});
// No signed-in admin: the drawer's delete action stays out of these tests.
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => null,
}));
vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

function rowOf(name: string) {
  const row = screen.getByText(name).closest('div[class*="border-[#f0f2f4]"]');
  if (!(row instanceof HTMLElement)) throw new Error(`No row for ${name}`);
  return row;
}

describe("UsersView › Profili gör", () => {
  it("links a mentor's profile page from the row menu and from the drawer", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<UsersView tab={UserTab.Mentors} />);

    const row = within(rowOf("Deniz Yıldız"));
    await user.click(row.getByRole("button", { name: "Diğer işlemler" }));
    expect(row.getByRole("link", { name: "Profili gör" })).toHaveAttribute(
      "href",
      "/admin/users/mentor-1",
    );

    await user.click(row.getByRole("button", { name: "Diğer işlemler" }));
    await user.click(row.getByRole("button", { name: "Detay" }));
    expect(
      screen.getByRole("link", { name: "Profili gör: Deniz Yıldız" }),
    ).toHaveAttribute("href", "/admin/users/mentor-1");
  });

  it("links every team member to their profile page", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<UsersView tab={UserTab.Teams} />);

    await user.click(
      within(rowOf("Pazar Lab")).getByRole("button", { name: "Detay" }),
    );
    await user.click(screen.getByRole("button", { name: "Ekip" }));

    expect(
      screen.getByRole("link", { name: "Profili gör: Ece Kaya" }),
    ).toHaveAttribute("href", "/admin/users/mentee-1");
  });
});
