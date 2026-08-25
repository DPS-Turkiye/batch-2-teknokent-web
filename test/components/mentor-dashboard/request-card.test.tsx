import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorRequestCard } from "@/components/mentor-dashboard/request-card";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";

function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "40000000-0000-0000-0000-000000000012",
    requesterId: "requester-1",
    organizationId: "org-1",
    organizationName: "GreenLoop",
    mentorId: "mentor-1",
    mentorName: "Leyla Aksoy",
    supportArea: "İş modeli ve strateji",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-08-17T09:49:54.374504Z",
    messages: [],
    recommendationSnapshot: null,
    ...overrides,
  };
}

describe("MentorRequestCard", () => {
  it("renders the organization name, status label, and support area", () => {
    render(<MentorRequestCard request={request()} onReview={vi.fn()} />);

    expect(screen.getByText("GreenLoop")).toBeInTheDocument();
    expect(screen.getByText("Yanıt Bekliyor")).toBeInTheDocument();
    expect(screen.getByText("İş modeli ve strateji")).toBeInTheDocument();
  });

  it("calls onReview when the review button is clicked", async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();
    const item = request();

    render(<MentorRequestCard request={item} onReview={onReview} />);
    await user.click(screen.getByText("Talebi İncele & Yanıtla →"));

    expect(onReview).toHaveBeenCalledWith(item);
  });

  it("shows a timeline link only for accepted requests", () => {
    const { rerender } = render(
      <MentorRequestCard request={request()} onReview={vi.fn()} />,
    );
    expect(screen.queryByText("Süreci Görüntüle")).not.toBeInTheDocument();

    rerender(
      <MentorRequestCard
        request={request({ status: MentorshipRequestStatus.Accepted })}
        onReview={vi.fn()}
      />,
    );

    const link = screen.getByText("Süreci Görüntüle");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "/mentor-dashboard/mentorship/40000000-0000-0000-0000-000000000012",
    );
  });

  it("shows the startup's sector and stage when a recommendation snapshot exists", () => {
    render(
      <MentorRequestCard
        request={request({
          recommendationSnapshot: {
            matchingMethod: "semantic",
            matchingModel: "gpt-4o-mini",
            generatedAt: "2026-08-17T09:00:00Z",
            startupName: "GreenLoop",
            startupSector: "ClimateTech",
            startupStage: "Pilot",
            startupSummary: null,
            startupTechnologies: [],
          },
        })}
        onReview={vi.fn()}
      />,
    );

    expect(screen.getByText("ClimateTech · Pilot")).toBeInTheDocument();
  });

  it("shows nothing extra when there is no recommendation snapshot", () => {
    render(<MentorRequestCard request={request()} onReview={vi.fn()} />);

    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});
