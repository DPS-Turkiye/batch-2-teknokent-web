import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminProgramMatchingPage from "@/app/admin/programs/[id]/matching/page";

vi.mock("@/components/coordinator/program-matching-view", () => ({
  ProgramMatchingView: ({
    programId,
    initialTeamId,
  }: {
    programId: string;
    initialTeamId?: string;
  }) => (
    <p>
      ProgramMatchingView {programId} {initialTeamId ?? "none"}
    </p>
  ),
}));

describe("admin Eşleşmeler route", () => {
  it("opens matching for the program and the team in the link", async () => {
    render(
      await AdminProgramMatchingPage({
        params: Promise.resolve({ id: "program-1" }),
        searchParams: Promise.resolve({ team: "team-7" }),
      }),
    );
    expect(
      screen.getByText("ProgramMatchingView program-1 team-7"),
    ).toBeInTheDocument();
  });

  it("opens matching without a preselected team", async () => {
    render(
      await AdminProgramMatchingPage({
        params: Promise.resolve({ id: "program-1" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(
      screen.getByText("ProgramMatchingView program-1 none"),
    ).toBeInTheDocument();
  });
});
