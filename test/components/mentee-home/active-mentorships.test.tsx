import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActiveMentorships } from "@/components/mentee-home/active-mentorships";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";

function request(id: string, mentorName: string) {
  return menteeRequestFixture({
    id,
    mentorName,
    supportArea: "Yatırım turu hazırlığı",
    status: MentorshipRequestStatus.Accepted,
  });
}

const nextMeeting = menteeMeetingFixture({
  scheduledAt: "2026-08-30T10:00:00.000Z",
});

describe("ActiveMentorships", () => {
  it("shows open actions first, else the next meeting, with a link to each mentorship", () => {
    render(
      <ActiveMentorships
        requests={[
          request("r-1", "Selin Kaya"),
          request("r-2", "Nihan Öztürk"),
          request("r-3", "Kerem Yıldırım"),
        ]}
        openActionCountByRequest={{ "r-1": 1 }}
        nextMeetingByRequest={{ "r-2": nextMeeting }}
        loading={false}
      />,
    );

    expect(screen.getByText("1 açık aksiyon")).toBeInTheDocument();
    expect(
      screen.getByText("Sonraki görüşme · 30 Ağustos"),
    ).toBeInTheDocument();
    expect(screen.getByText("Planlı görüşme yok")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentorluğa git: Selin Kaya" }),
    ).toHaveAttribute("href", "/mentorships?tab=active");
  });

  it("says it is loading, then shows the empty state", () => {
    const props = {
      requests: [],
      openActionCountByRequest: {},
      nextMeetingByRequest: {},
    };
    const { rerender } = render(<ActiveMentorships {...props} loading />);
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    expect(
      screen.queryByText("Henüz aktif mentorluk yok."),
    ).not.toBeInTheDocument();

    rerender(<ActiveMentorships {...props} loading={false} />);
    expect(screen.getByText("Henüz aktif mentorluk yok.")).toBeInTheDocument();
  });
});
