import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgramReportView } from "@/components/coordinator/program-report-view";
import { renderWithQueryClient } from "@test/test-utils";
import {
  programMeetingRatings,
  reportOverview,
} from "@test/fixtures/program-report";

vi.mock("@/hooks/use-program-report", () => ({
  useProgramReport: () => ({
    data: reportOverview(),
    isLoading: false,
    error: null,
  }),
  useProgramMeetingRatings: () => ({
    data: programMeetingRatings(),
    isLoading: false,
    error: null,
  }),
}));

describe("coordinator Program raporu", () => {
  it("shows the report for this one program only", () => {
    renderWithQueryClient(<ProgramReportView programId="program-1" />);

    expect(
      screen.getByRole("heading", { name: "Program raporu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ODTÜ Stars 2026" }),
    ).toHaveAttribute("href", "/coordinator/programs/program-1");
    expect(screen.getByText("4,3/5")).toBeInTheDocument();
    expect(screen.getByLabelText("Program").closest("label")).toHaveClass(
      "hidden",
    );
    expect(
      screen.queryByRole("button", { name: "Sistem Aktivitesi" }),
    ).not.toBeInTheDocument();
  });
});
