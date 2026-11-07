import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProgramsView } from "@/components/admin/programs-view";
import type { AdminOverview, AdminProgram } from "@/interfaces/admin-overview";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { renderWithQueryClient } from "@test/test-utils";

function program(overrides: Partial<AdminProgram>): AdminProgram {
  return {
    id: "program-1",
    name: "BİGG Ankara 2027",
    status: ProgramStatus.Active,
    type: ProgramType.StartupMentoring,
    createdAt: "2026-01-01T00:00:00Z",
    coordinatorId: "coordinator-1",
    coordinatorName: "Elif Demir",
    startupCount: 0,
    acceptedMentorCount: 0,
    pendingMentorCount: 0,
    startups: [],
    mentors: [],
    ...overrides,
  };
}

const overview: AdminOverview = {
  programs: [
    program({}),
    program({
      id: "program-2",
      name: "ODTÜ Akran 2027",
      status: ProgramStatus.Draft,
      type: ProgramType.PeerMentoring,
      coordinatorId: null,
      coordinatorName: null,
    }),
  ],
  users: [],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

vi.mock("@/hooks/use-admin-overview", () => ({
  ADMIN_OVERVIEW_QUERY_KEY: ["admin-overview"],
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

describe("admin Programlar", () => {
  it("opens a program inside the admin workspace", () => {
    renderWithQueryClient(<ProgramsView />);
    expect(screen.getAllByRole("link", { name: "Aç" })[0]).toHaveAttribute(
      "href",
      "/admin/programs/program-1",
    );
  });

  it("labels every row with its program type and a draft as Taslak", () => {
    renderWithQueryClient(<ProgramsView />);
    expect(
      screen.getByText("Girişim Mentörlüğü", { selector: "span" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Akran Mentörlüğü", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Taslak").length).toBeGreaterThan(0);
  });

  it("filters by program type", async () => {
    renderWithQueryClient(<ProgramsView />);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Program türü" }),
      ProgramType.PeerMentoring,
    );
    expect(screen.getByText("ODTÜ Akran 2027")).toBeInTheDocument();
    expect(screen.queryByText("BİGG Ankara 2027")).not.toBeInTheDocument();
  });

  it("shows only drafts under the Taslak filter", async () => {
    renderWithQueryClient(<ProgramsView />);
    await userEvent.click(screen.getByRole("button", { name: /^Taslak/ }));
    expect(screen.getByText("ODTÜ Akran 2027")).toBeInTheDocument();
    expect(screen.queryByText("BİGG Ankara 2027")).not.toBeInTheDocument();
  });
});
