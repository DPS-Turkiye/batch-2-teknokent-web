import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgramsView } from "@/components/admin/programs-view";
import type { AdminOverview } from "@/interfaces/admin-overview";
import { renderWithQueryClient } from "@test/test-utils";

const overview: AdminOverview = {
  programs: [
    {
      id: "program-1",
      name: "BİGG Ankara 2027",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      coordinatorId: "coordinator-1",
      coordinatorName: "Elif Demir",
      startupCount: 0,
      acceptedMentorCount: 0,
      pendingMentorCount: 0,
      startups: [],
      mentors: [],
    },
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
    expect(screen.getByRole("link", { name: "Aç" })).toHaveAttribute(
      "href",
      "/admin/programs/program-1",
    );
  });
});
