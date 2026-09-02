import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UpcomingMeetingsList } from "@/components/upcoming-meetings-list";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";

const meeting: MeetingItem = {
  id: "meeting-1",
  organizationId: "org-1",
  organizationName: "GreenLoop",
  mentorName: "Leyla Aksoy",
  scheduledAt: "2026-09-10T10:00:00.000Z",
  durationMinutes: 45,
  agenda: "Ürün incelemesi",
  meetLink: "https://meet.google.com/abc-defg-hij",
  status: MeetingStatus.Scheduled,
};

describe("UpcomingMeetingsList", () => {
  it("shows time, title, counterpart, and a join link", () => {
    render(
      <UpcomingMeetingsList
        meetings={[meeting]}
        emptyLabel="Yaklaşan etkinlik bulunmuyor."
        counterpartOf={(item) => item.organizationName}
      />,
    );

    expect(screen.getByText("Ürün incelemesi")).toBeInTheDocument();
    expect(screen.getByText("GreenLoop")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Katıl" })).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );
  });

  it("shows the empty label when there are no meetings", () => {
    render(
      <UpcomingMeetingsList
        meetings={[]}
        emptyLabel="Yaklaşan etkinlik bulunmuyor."
      />,
    );

    expect(
      screen.getByText("Yaklaşan etkinlik bulunmuyor."),
    ).toBeInTheDocument();
  });
});
