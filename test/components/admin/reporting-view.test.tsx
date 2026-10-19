import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReportingView } from "@/components/admin/reporting-view";
import { useProgramMeetingRatings } from "@/hooks/use-program-report";
import { InLocale, renderWithQueryClient } from "@test/test-utils";
import {
  programMeetingRatings,
  reportOverview,
} from "@test/fixtures/program-report";

vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: () => ({
    data: reportOverview(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-program-report", () => ({
  useProgramMeetingRatings: vi.fn(),
}));

describe("admin Raporlama", () => {
  beforeEach(() => {
    vi.mocked(useProgramMeetingRatings).mockReturnValue({
      data: programMeetingRatings(),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProgramMeetingRatings>);
  });

  it("fills Memnuniyet from the post-meeting ratings and shows them in detail", () => {
    renderWithQueryClient(<ReportingView />);

    expect(screen.getByText("4,3/5")).toBeInTheDocument();
    expect(
      screen.getByText("9/12 görüşme değerlendirildi"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Görüşme değerlendirmeleri" }),
    ).toBeInTheDocument();
    expect(useProgramMeetingRatings).toHaveBeenCalledWith(
      "program-1",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ReportingView />
      </InLocale>,
    );

    expect(screen.getByText("4.3/5")).toBeInTheDocument();
    expect(screen.getByText("9/12 meetings rated")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Meeting ratings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "System activity" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Next steps got clearer")).toBeInTheDocument();
  });

  it("lets the admin pick any program and see Sistem Aktivitesi", () => {
    renderWithQueryClient(<ReportingView />);

    expect(screen.getByLabelText("Program")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sistem Aktivitesi" }),
    ).toBeInTheDocument();
  });
});
