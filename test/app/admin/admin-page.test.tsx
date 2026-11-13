import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/admin/page";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import type { AdminOverview } from "@/interfaces/admin-overview";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

// The admin home leaves out links to tabs its edition hides; this page shows the Teknokent home.
vi.mock("@/hooks/use-edition", async () => {
  const { Edition } = await import("@/interfaces/edition");
  return { useEdition: () => Edition.Teknokent };
});
vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: vi.fn(),
}));

const emptyOverview: AdminOverview = {
  programs: [],
  users: [],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

describe("AdminPage", () => {
  beforeEach(() => {
    vi.mocked(useAdminOverview).mockReturnValue({
      data: emptyOverview,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminOverview>);
  });

  it("shows live queue counts instead of sample programs", () => {
    renderWithQueryClient(<AdminPage />);

    expect(screen.getByText("Eşleşme bekleyen takımlar")).toBeInTheDocument();
    expect(screen.getByText("Henüz program yok.")).toBeInTheDocument();
    expect(screen.queryByText("METU Stars 2026")).not.toBeInTheDocument();
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <AdminPage />
      </InLocale>,
    );

    expect(screen.getByText("Teams waiting for a match")).toBeInTheDocument();
    expect(screen.getByText("No programs yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Program scope" }),
    ).toHaveDisplayValue("All programs");
    expect(
      screen.getByText("No overdue mentorship meetings or open bottlenecks."),
    ).toBeInTheDocument();
  });
});
