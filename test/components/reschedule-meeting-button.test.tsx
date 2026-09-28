import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RescheduleMeetingButton } from "@/components/reschedule-meeting-button";
import { MeetingStatus } from "@/interfaces/meeting";
import { proposeReschedule } from "@/lib/client/meeting-proposals";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meeting-proposals", () => ({
  proposeReschedule: vi.fn(),
}));

describe("RescheduleMeetingButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-28T09:00:00Z"));
    vi.mocked(proposeReschedule).mockResolvedValue(meetingProposal());
  });

  afterEach(() => vi.useRealTimers());

  it("proposes the new time for the meeting and says the other side confirms", async () => {
    const user = userEvent.setup();
    const meeting = menteeMeetingFixture({
      id: "meeting-1",
      scheduledAt: "2026-10-01T07:00:00Z",
      durationMinutes: 45,
    });
    renderWithQueryClient(
      <RescheduleMeetingButton
        meeting={meeting}
        pairLabel="Barış Öztürk"
        className=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Yeni saat öner" }));
    const dialog = screen.getByRole("dialog", { name: "Yeni saat öner" });
    expect(within(dialog).queryByText(/Konu/)).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(/diğer taraf onaylayınca/),
    ).toBeInTheDocument();
    const when = within(dialog).getByLabelText("Tarih ve saat");
    await user.clear(when);
    await user.type(when, "2026-10-02T14:00");
    await user.click(
      within(dialog).getByRole("button", { name: "İki tarafa öner" }),
    );

    expect(proposeReschedule).toHaveBeenCalledWith("meeting-1", {
      scheduledAt: new Date("2026-10-02T14:00").toISOString(),
      durationMinutes: 45,
    });
    expect(await screen.findByText(/Yeni saat önerildi/)).toBeInTheDocument();
  });

  it("is hidden for a past or cancelled meeting", () => {
    renderWithQueryClient(
      <>
        <RescheduleMeetingButton
          meeting={menteeMeetingFixture({
            scheduledAt: "2026-09-20T07:00:00Z",
          })}
          pairLabel="Mentor"
          className=""
        />
        <RescheduleMeetingButton
          meeting={menteeMeetingFixture({
            scheduledAt: "2026-10-01T07:00:00Z",
            status: MeetingStatus.Cancelled,
          })}
          pairLabel="Mentor"
          className=""
        />
      </>,
    );
    expect(
      screen.queryByRole("button", { name: "Yeni saat öner" }),
    ).not.toBeInTheDocument();
  });
});
