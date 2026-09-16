import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MeetingTopicStackDialog } from "@/components/startup/meeting-topic-stack-dialog";
import { groupMeetingsByTopic } from "@/lib/startup-meetings";
import {
  detailsFixture,
  meetingFixture,
} from "@test/fixtures/startup-meetings";

const NOW = new Date("2026-09-11T12:00:00Z");

const topic = groupMeetingsByTopic(
  [
    meetingFixture("finance-1", "2026-07-10T09:00:00Z", {
      agenda: "Financial Model & Sustainability",
      mentorshipRequestId: "req-finance",
    }),
    meetingFixture("finance-2", "2026-08-18T09:00:00Z", {
      agenda: "Financial Model & Sustainability",
      mentorshipRequestId: "req-finance",
    }),
    meetingFixture("finance-3", "2026-09-01T09:00:00Z", {
      agenda: "Financial Model & Sustainability",
      mentorshipRequestId: "req-finance",
    }),
  ],
  NOW,
)[0];

describe("MeetingTopicStackDialog", () => {
  it("lists the topic's meetings newest-first with orange accents", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSelectMeeting = vi.fn();
    render(
      <MeetingTopicStackDialog
        details={detailsFixture()}
        onClose={onClose}
        onOpenFile={vi.fn()}
        onSelectMeeting={onSelectMeeting}
        topic={topic}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(topic.title)).toHaveClass("text-[#e86f22]");
    expect(topic.meetings.map((meeting) => meeting.id)).toEqual([
      "finance-3",
      "finance-2",
      "finance-1",
    ]);

    const cards = within(dialog)
      .getAllByRole("button")
      .filter((el) => el.getAttribute("tabindex") === "0");
    expect(cards).toHaveLength(3);

    await user.click(cards[0]);
    expect(onSelectMeeting).toHaveBeenCalledWith("finance-3");

    await user.click(screen.getByRole("button", { name: "Kapat" }));
    expect(onClose).toHaveBeenCalled();
  });
});
