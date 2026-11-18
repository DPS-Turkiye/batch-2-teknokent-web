import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MentorshipRequestStartupPage from "@/app/mentorships/requests/[id]/page";
import type { MentorReviewMode } from "@/types/mentorship";

vi.mock("@/components/mentorships/mentor-request-startup-detail", () => ({
  MentorRequestStartupDetail: ({
    requestId,
    initialReview,
  }: {
    requestId: string;
    initialReview: MentorReviewMode | null;
  }) => (
    <p>
      {requestId} · {initialReview ?? "closed"}
    </p>
  ),
}));

async function renderPage(review?: string | string[]) {
  render(
    await MentorshipRequestStartupPage({
      params: Promise.resolve({ id: "req-1" }),
      searchParams: Promise.resolve(review === undefined ? {} : { review }),
    }),
  );
}

describe("mentor request route", () => {
  it("opens the propose form when the link asks for it", async () => {
    await renderPage("propose");
    expect(screen.getByText("req-1 · propose")).toBeInTheDocument();
  });

  it("keeps the review closed without a known step", async () => {
    await renderPage("anything");
    expect(screen.getByText("req-1 · closed")).toBeInTheDocument();
  });

  it("keeps the review closed when the step is given twice", async () => {
    await renderPage(["propose", "info"]);
    expect(screen.getByText("req-1 · closed")).toBeInTheDocument();
  });

  it("keeps the review closed with no step in the link", async () => {
    await renderPage();
    expect(screen.getByText("req-1 · closed")).toBeInTheDocument();
  });
});
