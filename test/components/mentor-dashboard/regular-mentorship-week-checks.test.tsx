import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegularMentorshipWeekChecksPanel } from "@/components/mentor-dashboard/regular-mentorship-week-checks";
import { renderWithQueryClient } from "@test/test-utils";

const getMentorshipWeekChecks = vi.fn();
const setMentorshipWeekCheck = vi.fn();

vi.mock("@/lib/client/mentorships", () => ({
  getMentorshipWeekChecks: (...args: unknown[]) =>
    getMentorshipWeekChecks(...args),
  setMentorshipWeekCheck: (...args: unknown[]) =>
    setMentorshipWeekCheck(...args),
}));

describe("RegularMentorshipWeekChecksPanel", () => {
  beforeEach(() => {
    getMentorshipWeekChecks.mockReset();
    setMentorshipWeekCheck.mockReset();
    getMentorshipWeekChecks.mockResolvedValue([
      {
        mentorshipId: "m-1",
        organizationName: "Döngü",
        daysPerWeek: 1,
        startDate: "2026-09-01",
        endDate: "2026-12-20",
        weekStart: "2026-09-14",
        completed: false,
      },
    ]);
    setMentorshipWeekCheck.mockResolvedValue({
      mentorshipId: "m-1",
      organizationName: "Döngü",
      daysPerWeek: 1,
      startDate: "2026-09-01",
      endDate: "2026-12-20",
      weekStart: "2026-09-14",
      completed: true,
    });
  });

  it("renders weekly checkboxes and toggles completion", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <RegularMentorshipWeekChecksPanel weekStart="2026-09-14" />,
    );

    expect(
      await screen.findByText("Bu hafta görüşmen gereken düzenli mentorlükler"),
    ).toBeInTheDocument();
    const checkbox = await screen.findByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(setMentorshipWeekCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorshipId: "m-1",
        weekStart: "2026-09-14",
        completed: true,
      }),
      expect.anything(),
    );
  });
});
