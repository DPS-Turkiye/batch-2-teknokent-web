import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminProgramTeamsPage from "@/app/admin/programs/[id]/teams/page";

vi.mock("@/components/coordinator/program-teams-view", () => ({
  ProgramTeamsView: ({ programId }: { programId: string }) => (
    <p>ProgramTeamsView {programId}</p>
  ),
}));

describe("admin Takımlar route", () => {
  it("opens the shared Takımlar screen for the program in the URL", async () => {
    render(
      await AdminProgramTeamsPage({
        params: Promise.resolve({ id: "program-1" }),
      }),
    );
    expect(screen.getByText("ProgramTeamsView program-1")).toBeInTheDocument();
  });
});
