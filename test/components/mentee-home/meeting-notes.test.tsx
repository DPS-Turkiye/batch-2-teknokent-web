import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MeetingNotes } from "@/components/mentee-home/meeting-notes";
import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "held-1",
    organizationId: "org-1",
    mentorName: "Nihan Öztürk",
    mentorshipRequestId: "r-1",
    agenda: "Finansal Model ve Sürdürülebilirlik",
    scheduledAt: "2026-08-18T10:00:00.000Z",
    durationMinutes: 45,
    status: "SCHEDULED",
    ...overrides,
  };
}

const requestsById = {
  "r-1": { id: "r-1", supportArea: "UX/UI Mentorluğu" } as MentorshipRequest,
};

describe("MeetingNotes", () => {
  it("lists held meetings with their date, mentorship and to-do state", () => {
    render(
      <MeetingNotes
        meetings={[
          meeting(),
          meeting({ id: "held-2" }),
          meeting({ id: "held-3" }),
        ]}
        totalCount={5}
        openTodoCounts={
          new Map([
            ["held-1", 2],
            ["held-2", 0],
          ])
        }
        requestsById={requestsById}
        loading={false}
      />,
    );

    expect(screen.getByRole("link", { name: "Tümü (5) →" })).toHaveAttribute(
      "href",
      "/startup/meetings",
    );
    expect(screen.getAllByText("18 Ağustos 2026")).toHaveLength(3);
    expect(screen.getAllByText("Nihan Öztürk · UX/UI Mentorluğu")).toHaveLength(
      3,
    );
    expect(screen.getByText("Görevler tamamlanmadı")).toBeInTheDocument();
    expect(screen.getByText("Görevler tamamlandı")).toBeInTheDocument();
  });

  it("shows the empty state only once loading has finished", () => {
    const props = {
      meetings: [],
      totalCount: 0,
      openTodoCounts: new Map<string, number>(),
      requestsById: {},
    };
    const { rerender } = render(<MeetingNotes {...props} loading />);
    expect(
      screen.queryByText("Henüz gerçekleşen bir görüşmen yok."),
    ).not.toBeInTheDocument();

    rerender(<MeetingNotes {...props} loading={false} />);
    expect(
      screen.getByText("Henüz gerçekleşen bir görüşmen yok."),
    ).toBeInTheDocument();
  });
});
