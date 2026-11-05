import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminProgramReportPage from "@/app/admin/programs/[id]/report/page";

vi.mock("@/components/coordinator/program-report-view", () => ({
  ProgramReportView: ({ programId }: { programId: string }) => (
    <p>ProgramReportView {programId}</p>
  ),
}));

describe("admin Program raporu route", () => {
  it("opens the shared Program raporu screen for the program in the URL", async () => {
    render(
      await AdminProgramReportPage({
        params: Promise.resolve({ id: "program-1" }),
      }),
    );
    expect(screen.getByText("ProgramReportView program-1")).toBeInTheDocument();
  });
});
