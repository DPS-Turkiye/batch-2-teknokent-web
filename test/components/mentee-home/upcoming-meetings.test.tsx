import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UpcomingMeetings } from "@/components/mentee-home/upcoming-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";

function meeting(overrides: Partial<MeetingItem> = {}) {
  return menteeMeetingFixture({
    id: "m-2",
    mentorName: "Kerem Yıldırım",
    mentorshipRequestId: "r-2",
    agenda: "Growth Strategy görüşmesi",
    ...overrides,
  });
}

const request = menteeRequestFixture({
  id: "r-2",
  mentorName: "Kerem Yıldırım",
  supportArea: "Growth Mentorluğu",
  status: MentorshipRequestStatus.Accepted,
});

describe("UpcomingMeetings", () => {
  it("shows each meeting with its mentorship, status and actions", () => {
    render(
      <UpcomingMeetings
        meetings={[meeting()]}
        requestsById={{ "r-2": request }}
        loading={false}
      />,
    );

    expect(
      screen.getByText("Kerem Yıldırım · Growth Mentorluğu"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Growth Strategy görüşmesi" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Planlandı")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Görüşmeye katıl" }),
    ).toHaveAttribute("href", expect.stringContaining("m-2"));
    expect(screen.getByRole("link", { name: "Takvimi aç →" })).toHaveAttribute(
      "href",
      "/calendar",
    );
  });

  it("shows at most two meetings", () => {
    render(
      <UpcomingMeetings
        meetings={[
          meeting({ id: "a" }),
          meeting({ id: "b" }),
          meeting({ id: "c" }),
        ]}
        requestsById={{}}
        loading={false}
      />,
    );

    expect(
      screen.getAllByRole("link", { name: "Görüşmeye katıl" }),
    ).toHaveLength(2);
  });

  it("says it is loading, then shows the empty state", () => {
    const { rerender } = render(
      <UpcomingMeetings meetings={[]} requestsById={{}} loading />,
    );
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    expect(
      screen.queryByText("Başka yaklaşan görüşmen yok."),
    ).not.toBeInTheDocument();

    rerender(
      <UpcomingMeetings meetings={[]} requestsById={{}} loading={false} />,
    );
    expect(
      screen.getByText("Başka yaklaşan görüşmen yok."),
    ).toBeInTheDocument();
  });
});
