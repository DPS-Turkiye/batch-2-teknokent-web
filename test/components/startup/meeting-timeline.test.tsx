import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MeetingTimeline } from "@/components/startup/meeting-timeline";
import { groupMeetingsByYear } from "@/lib/startup-meetings";
import {
  detailsFixture,
  meetingFileFixture,
  meetingFixture,
} from "@test/fixtures/startup-meetings";

const years = groupMeetingsByYear([
  meetingFixture("sep", "2026-09-02T09:00:00Z"),
  meetingFixture("aug", "2026-08-18T09:00:00Z"),
  meetingFixture("last-year", "2025-11-05T09:00:00Z"),
]);

function renderTimeline(overrides = {}) {
  const props = {
    details: detailsFixture({
      files: [
        meetingFileFixture("user-flow", "sep"),
        meetingFileFixture("feature-list", "sep"),
        meetingFileFixture("wireframes", "sep"),
      ],
    }),
    expandedMonthKey: "2026-09",
    expandedYear: 2026,
    onOpenFile: vi.fn(),
    onOpenMeeting: vi.fn(),
    onToggleMonth: vi.fn(),
    onToggleYear: vi.fn(),
    years,
    ...overrides,
  };
  render(<MeetingTimeline {...props} />);
  return props;
}

describe("MeetingTimeline", () => {
  it("opens the expanded month with its meetings and files", async () => {
    const user = userEvent.setup();
    const props = renderTimeline();

    const september = screen.getByRole("region", { name: "Eylül 2026" });
    expect(within(september).getByText("1 Toplantı")).toBeInTheDocument();
    expect(within(september).getByText("+1")).toBeInTheDocument();
    await user.click(
      within(september).getByRole("button", { name: /user-flow\.pdf/ }),
    );

    expect(props.onOpenFile).toHaveBeenCalledWith("user-flow");
  });

  it("folds months and years behind their own buttons", async () => {
    const user = userEvent.setup();
    const props = renderTimeline();

    await user.click(screen.getByRole("button", { name: /Ağustos/ }));
    await user.click(screen.getByRole("button", { name: "2025" }));

    expect(props.onToggleMonth).toHaveBeenCalledWith("2026-08");
    expect(props.onToggleYear).toHaveBeenCalledWith(2025);
    expect(screen.queryByText("Kasım")).not.toBeInTheDocument();
  });
});
