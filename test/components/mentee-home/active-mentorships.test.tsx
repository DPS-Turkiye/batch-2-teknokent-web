import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActiveMentorships } from "@/components/mentee-home/active-mentorships";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";

function request(id: string, mentorName: string): MentorshipRequest {
  return {
    id,
    mentorName,
    supportArea: "Yatırım turu hazırlığı",
    status: MentorshipRequestStatus.Accepted,
  } as MentorshipRequest;
}

const nextMeeting = {
  id: "m-1",
  organizationId: "org-1",
  scheduledAt: "2026-08-30T10:00:00.000Z",
  durationMinutes: 45,
  status: "SCHEDULED",
} as MeetingItem;

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
    ).toHaveAttribute("href", "/mentor-request/status?id=r-1");
  });

  it("shows the empty state only once loading has finished", () => {
    const props = {
      requests: [],
      openActionCountByRequest: {},
      nextMeetingByRequest: {},
    };
    const { rerender } = render(<ActiveMentorships {...props} loading />);
    expect(
      screen.queryByText("Henüz aktif mentorluk yok."),
    ).not.toBeInTheDocument();

    rerender(<ActiveMentorships {...props} loading={false} />);
    expect(screen.getByText("Henüz aktif mentorluk yok.")).toBeInTheDocument();
  });
});
