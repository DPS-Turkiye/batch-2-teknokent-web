import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MeetingTopicGrid } from "@/components/startup/meeting-topic-grid";
import { MeetingLayout } from "@/hooks/use-startup-meetings";
import { groupMeetingsByTopic } from "@/lib/startup-meetings";
import {
  detailsFixture,
  meetingFixture,
} from "@test/fixtures/startup-meetings";

const NOW = new Date("2026-09-11T12:00:00Z");

const topics = groupMeetingsByTopic(
  [
    meetingFixture("mvp-next", "2026-09-18T09:00:00Z"),
    meetingFixture("finance-1", "2026-07-10T09:00:00Z", {
      agenda: "Financial Model & Sustainability",
      mentorshipRequestId: "req-finance",
    }),
    meetingFixture("finance-2", "2026-08-18T09:00:00Z", {
      agenda: "Financial Model & Sustainability",
      mentorshipRequestId: "req-finance",
    }),
  ],
  NOW,
);

describe("MeetingTopicGrid", () => {
  it("highlights the topic with a meeting ahead and marks the rest as held", () => {
    render(
      <MeetingTopicGrid
        details={detailsFixture()}
        layout={MeetingLayout.Grid}
        onOpenTopic={vi.fn()}
        topics={topics}
      />,
    );

    const upcoming = screen.getByRole("button", {
      name: "MVP Scope & User Flow notlarını aç",
    });
    expect(upcoming).toHaveClass("bg-[#ffe3d5]");
    expect(upcoming).toHaveTextContent("Yaklaşan");
    expect(upcoming).toHaveTextContent("UX/UI Mentor");
    const held = screen.getByRole("button", {
      name: "Financial Model & Sustainability notlarını aç",
    });
    expect(held).toHaveTextContent("Gerçekleşti");
    expect(held).toHaveTextContent("Son görüşme");
    expect(held).toHaveTextContent("18 Ağustos 2026");
  });

  it("opens the notes of the topic's meeting", async () => {
    const user = userEvent.setup();
    const onOpenTopic = vi.fn();
    render(
      <MeetingTopicGrid
        details={detailsFixture()}
        layout={MeetingLayout.List}
        onOpenTopic={onOpenTopic}
        topics={topics}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Financial Model & Sustainability notlarını aç",
      }),
    );

    expect(onOpenTopic).toHaveBeenCalledWith("req-finance");
    expect(screen.getByRole("list")).not.toHaveClass("xl:grid-cols-3");
  });
});
