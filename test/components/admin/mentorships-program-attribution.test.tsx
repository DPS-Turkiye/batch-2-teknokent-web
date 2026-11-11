import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MentorshipsView } from "@/components/admin/mentorships-view";
import type { AdminOverview, AdminProgram } from "@/interfaces/admin-overview";
import { MentorshipTab } from "@/types/admin-mentorships";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

vi.mock("@/hooks/use-admin-interventions", () => ({
  useAdminInterventions: () => ({ data: [], isLoading: false, error: null }),
  useOpenIntervention: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResolveIntervention: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function program(id: string, name: string): AdminProgram {
  return adminProgram({
    id,
    name,
    coordinatorId: "coord-1",
    coordinatorName: "Deniz Acar",
    startupCount: 1,
    acceptedMentorCount: 1,
    startups: [adminStartup({ programId: id, programName: name })],
  });
}

const today = new Date().toISOString().slice(0, 10);

const overview: AdminOverview = {
  programs: [
    program("program-1", "ODTÜ Stars 2026"),
    program("program-2", "Growth Circuit 2026"),
  ],
  users: [],
  mentorships: [
    adminMentorship({
      startDate: today,
      daysSinceMeeting: 2,
      programId: "program-1",
    }),
    adminMentorship({
      id: "m-2",
      mentorId: "mentor-2",
      mentorName: "Kerem Tan",
      startDate: today,
      daysSinceMeeting: 20,
      programId: "program-2",
    }),
  ],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

// Program names also fill the scope <select>, so skip the <option>s.
function rowOf(text: string) {
  const cell = screen
    .getAllByText(text)
    .find((element) => !(element instanceof HTMLOptionElement));
  const row = cell?.closest("div");
  if (!row) throw new Error(`No row for ${text}`);
  return row;
}

describe("Admin mentorships: a team in two programs", () => {
  it("counts each mentorship once, under the program it was made in", () => {
    renderWithQueryClient(<MentorshipsView tab={MentorshipTab.Overview} />);

    expect(screen.getByText("2 program")).toBeInTheDocument();
    for (const name of ["ODTÜ Stars 2026", "Growth Circuit 2026"]) {
      const [, , active] = Array.from(rowOf(name).children);
      expect(active).toHaveTextContent(/^1$/);
    }
  });

  it("lists the overdue pair under its own program only", () => {
    renderWithQueryClient(
      <MentorshipsView tab={MentorshipTab.Interventions} />,
    );

    expect(screen.queryByText("Ayşe Demir ↔ Lumen")).not.toBeInTheDocument();
    const row = rowOf("Kerem Tan ↔ Lumen");
    expect(within(row).getByText("Growth Circuit 2026")).toBeInTheDocument();
  });
});
