import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { renderWithQueryClient } from "@test/test-utils";

const coordinator = (overrides: Partial<AdminUser>): AdminUser => ({
  id: "c1",
  email: "ayla@tekno.co",
  fullName: "Ayla Bekler",
  role: "COORDINATOR",
  status: "APPROVED",
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
vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

function rowOf(name: string) {
  return screen
    .getByText(name)
    .closest('div[class*="border-[#f0f2f4]"]') as HTMLElement;
}

describe("UsersView", () => {
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
});
