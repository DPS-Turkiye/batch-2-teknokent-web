import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

const coordinator = (overrides: Partial<AdminUser>): AdminUser => ({
  id: "c1",
  email: "ayla@tekno.co",
  fullName: "Ayla Bekler",
  role: UserRole.Coordinator,
  status: UserAccountStatus.Approved,
  organizationId: null,
  organizationName: null,
  jobTitle: null,
  ...overrides,
});

const overview: AdminOverview = {
  programs: [],
  users: [
    coordinator({ passwordSet: false }),
    coordinator({
      id: "c2",
      email: "burcu@tekno.co",
      fullName: "Burcu Şen",
      passwordSet: true,
    }),
  ],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/users",
}));
vi.mock("@/lib/client/admin-academics", () => ({
  getAdminAcademics: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

function rowOf(name: string) {
  const row = screen.getByText(name).closest('div[class*="border-[#f0f2f4]"]');
  if (!(row instanceof HTMLElement)) throw new Error(`No row for ${name}`);
  return row;
}

describe("UsersView", () => {
  it("has an Akademisyenler tab that shows the institution's academicians", async () => {
    renderWithQueryClient(<UsersView tab="academics" />);

    expect(
      screen.getByRole("link", { name: /Akademisyenler/ }),
    ).toHaveAttribute("href", "/admin/users/academics");
    expect(
      await screen.findByText("Kurum verisinde henüz akademisyen yok."),
    ).toBeInTheDocument();
  });

  it("marks an added coordinator who has not set a password yet", () => {
    renderWithQueryClient(<UsersView tab="coordinators" />);

    expect(
      within(rowOf("Ayla Bekler")).getByText("Şifre belirlenmedi"),
    ).toBeInTheDocument();
    expect(within(rowOf("Burcu Şen")).getByText("Aktif")).toBeInTheDocument();
    expect(
      within(rowOf("Burcu Şen")).queryByText("Şifre belirlenmedi"),
    ).toBeNull();
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <UsersView tab="coordinators" />
      </InLocale>,
    );

    expect(
      within(rowOf("Ayla Bekler")).getByText("Password not set"),
    ).toBeInTheDocument();
    expect(within(rowOf("Burcu Şen")).getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Assigned programs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Add a coordinator" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\/ 2 coordinators$/)).toBeInTheDocument();
  });
});
