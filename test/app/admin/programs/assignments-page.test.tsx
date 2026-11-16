import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminProgramAssignmentsPage from "@/app/admin/programs/[id]/assignments/page";

vi.mock("@/components/coordinator/program-assignments-view", () => ({
  ProgramAssignmentsView: ({ programId }: { programId: string }) => (
    <p>ProgramAssignmentsView {programId}</p>
  ),
}));

describe("admin Ödevler route", () => {
  it("opens the shared Ödevler screen for the program in the URL", async () => {
    render(
      await AdminProgramAssignmentsPage({
        params: Promise.resolve({ id: "program-1" }),
      }),
    );
    expect(
      screen.getByText("ProgramAssignmentsView program-1"),
    ).toBeInTheDocument();
  });
});
