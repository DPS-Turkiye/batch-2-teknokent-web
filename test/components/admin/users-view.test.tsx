import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersView } from "@/components/admin/users-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { Edition } from "@/interfaces/edition";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { UserTab } from "@/types/admin-users";
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

const editionState = vi.hoisted(() => ({ current: "ODTU" }));

vi.mock("@/hooks/use-edition", () => ({
  useEdition: () => editionState.current,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
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

function tabNames() {
  return screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("href")?.startsWith("/admin/users"))
    .map((link) => link.getAttribute("href"));
}

describe("UsersView", () => {
  beforeEach(() => {
    editionState.current = Edition.Odtu;
  });

  it("shows ODTÜ coordinators, students and academicians, and no startup tabs", () => {
    renderWithQueryClient(<UsersView tab={UserTab.Coordinators} />);

    expect(tabNames()).toEqual([
      "/admin/users",
      "/admin/users/students",
      "/admin/users/academics",
    ]);
  });

  it("shows Teknokent coordinators, mentors and teams, and no ODTÜ tabs", () => {
    editionState.current = Edition.Teknokent;
    renderWithQueryClient(<UsersView tab={UserTab.Coordinators} />);

    expect(tabNames()).toEqual([
      "/admin/users",
      "/admin/users/mentors",
      "/admin/users/teams",
    ]);
  });

  it("answers another edition's tab like a page that does not exist", () => {
    editionState.current = Edition.Teknokent;

    expect(() =>
      renderWithQueryClient(<UsersView tab={UserTab.Students} />),
    ).toThrow("NEXT_NOT_FOUND");
  });

  it("has an Akademisyenler tab that shows the institution's academicians", async () => {
    renderWithQueryClient(<UsersView tab={UserTab.Academics} />);

    expect(
      screen.getByRole("link", { name: /Akademisyenler/ }),
    ).toHaveAttribute("href", "/admin/users/academics");
    expect(
      await screen.findByText("Kurum verisinde henüz akademisyen yok."),
    ).toBeInTheDocument();
  });

  it("marks an added coordinator who has not set a password yet", () => {
    renderWithQueryClient(<UsersView tab={UserTab.Coordinators} />);

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
        <UsersView tab={UserTab.Coordinators} />
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
