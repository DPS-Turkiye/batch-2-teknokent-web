import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SentRequests } from "@/components/mentee-home/sent-requests";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { SentRequestState } from "@/types/mentee-home";

function request(overrides: Partial<MentorshipRequest>): MentorshipRequest {
  return {
    id: "r-1",
    mentorName: "Barış Öztürk",
    supportArea: "Teknik ekip kurulumu",
    status: MentorshipRequestStatus.MoreInfoRequested,
    ...overrides,
  } as MentorshipRequest;
}

describe("SentRequests", () => {
  it("asks the mentee to reply when the request is waiting on them", () => {
    render(
      <SentRequests
        requests={[
          { request: request({}), state: SentRequestState.ActionNeeded },
          {
            request: request({
              id: "r-2",
              mentorName: "Deniz Aksoy",
              supportArea: "Ürün stratejisi",
              status: MentorshipRequestStatus.Pending,
            }),
            state: SentRequestState.MentorReviewing,
          },
        ]}
        loading={false}
      />,
    );

    expect(screen.getByText("Aksiyon gerekli")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Talebi yanıtla" }),
    ).toHaveAttribute("href", "/mentor-request/status?id=r-1");
    expect(screen.getByText("Mentor inceliyor")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Deniz Aksoy" })).toHaveAttribute(
      "href",
      "/mentor-request/status?id=r-2",
    );
    expect(screen.getByRole("link", { name: "Tümü (2) →" })).toHaveAttribute(
      "href",
      "/mentorships?tab=requests",
    );
  });

  it("shows the empty state only once loading has finished", () => {
    const { rerender } = render(<SentRequests requests={[]} loading />);
    expect(screen.queryByText("Bekleyen talebin yok.")).not.toBeInTheDocument();

    rerender(<SentRequests requests={[]} loading={false} />);
    expect(screen.getByText("Bekleyen talebin yok.")).toBeInTheDocument();
  });
});
