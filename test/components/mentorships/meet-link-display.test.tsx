import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MeetingDetailModal } from "@/components/calendar/meeting-detail-modal";
import { MeetLinkDisplay } from "@/components/mentorships/meet-link-display";
import { openMeetingWindow } from "@/lib/meeting-window";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { InLocale } from "@test/test-utils";

vi.mock("@/lib/meeting-window", () => ({
  openMeetingWindow: vi.fn(() => true),
}));
vi.mock("@/components/calendar/sync-meeting-actions", () => ({
  SyncMeetingActions: () => null,
}));

const LINK = "https://meet.google.com/abc-defg-hij";

describe("the mentee's Meet links", () => {
  afterEach(() => vi.clearAllMocks());

  it("opens the link of the meeting page beside Menton, also when it was typed without https", async () => {
    render(
      <InLocale locale="tr">
        <MeetLinkDisplay meetLink="meet.google.com/abc-defg-hij" />
      </InLocale>,
    );

    await userEvent.click(screen.getByRole("link"));

    expect(openMeetingWindow).toHaveBeenCalledWith(LINK);
  });

  it("opens the link of the calendar's meeting beside Menton", async () => {
    render(
      <InLocale locale="tr">
        <MeetingDetailModal
          meeting={menteeMeetingFixture({ meetLink: LINK })}
          onClose={() => undefined}
        />
      </InLocale>,
    );

    await userEvent.click(screen.getByRole("link", { name: LINK }));

    expect(openMeetingWindow).toHaveBeenCalledWith(LINK);
  });
});
