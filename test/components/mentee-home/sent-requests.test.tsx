import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SentRequests } from "@/components/mentee-home/sent-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { SentRequestState } from "@/types/mentee-home";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";

describe("SentRequests", () => {
  it("asks the mentee to reply when the request is waiting on them", () => {
    render(
      <SentRequests
        requests={[
          {
            request: menteeRequestFixture({
              id: "r-1",
              status: MentorshipRequestStatus.MoreInfoRequested,
            }),
            state: SentRequestState.ActionNeeded,
          },
          {
            request: menteeRequestFixture({
              id: "r-2",
              mentorName: "Deniz Aksoy",
              supportArea: "Ürün stratejisi",
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

  it("says it is loading, then shows the empty state", () => {
    const { rerender } = render(<SentRequests requests={[]} loading />);
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    expect(screen.queryByText("Bekleyen talebin yok.")).not.toBeInTheDocument();

    rerender(<SentRequests requests={[]} loading={false} />);
    expect(screen.getByText("Bekleyen talebin yok.")).toBeInTheDocument();
  });
});
