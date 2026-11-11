import { screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { ProgramReportView } from "@/components/coordinator/program-report-view";
import {
  meetingFeedbackState,
  programMeetingRatings,
  reportOverview,
} from "@test/fixtures/program-report";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/coordinator/programs/program-1"),
}));

vi.mock("@/components/coordinator/program-sessions-section", () => ({
  ProgramSessionsSection: ({ programId }: { programId: string }) => (
    <div data-testid="program-sessions">{programId}</div>
  ),
}));

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
  useProgramMeetingFeedback: () => meetingFeedbackState(),
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
    expect(screen.getByTestId("program-sessions")).toHaveTextContent(
      "program-1",
    );
  });

  it("keeps an admin's breadcrumbs in the admin workspace", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/program-1/report");
    renderWithQueryClient(<ProgramReportView programId="program-1" />);

    expect(screen.getByRole("link", { name: "Programlar" })).toHaveAttribute(
      "href",
      "/admin/programs",
    );
    expect(
      screen.getByRole("link", { name: "ODTÜ Stars 2026" }),
    ).toHaveAttribute("href", "/admin/programs/program-1");
  });
});
