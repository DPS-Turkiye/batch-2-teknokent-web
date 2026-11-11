import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { MentorRequestStartupDetail } from "@/components/mentorships/mentor-request-startup-detail";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/mentorships/document-request-checklist", () => ({
  DocumentRequestChecklist: () => null,
}));
vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: () => vi.fn(),
}));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorRequestDecision: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMentorshipRequest: () => ({
    // No organization, so the team's profile, members and files are not fetched.
    data: menteeRequestFixture({
      programName: "QA Recorded Program",
      id: "req-1",
      mentorId: "mentor-1",
      requesterId: "mentee-1",
      requesterName: "Gülse Buran",
      organizationId: "",
      organizationName: "Döngü",
      supportArea: "Ürün",
      summary: "MVP önceliklerini netleştirmek",
      requesterMessage: "",
      status: MentorshipRequestStatus.Pending,
      createdAt: "2026-10-01T09:00:00Z",
    }),
    isLoading: false,
    error: null,
  }),
}));

describe("MentorRequestStartupDetail", () => {
  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <MentorRequestStartupDetail requestId="req-1" />
      </InLocale>,
    );

    expect(
      screen.getByRole("button", { name: "Accept mentorship" }),
    ).toBeInTheDocument();
    expect(screen.getByText("New request")).toBeInTheDocument();
    expect(screen.getByText("About the startup")).toBeInTheDocument();
    expect(screen.getByText("Team members")).toBeInTheDocument();
  });

  it("shows the startup in the mentor's blue accent", () => {
    renderWithQueryClient(<MentorRequestStartupDetail requestId="req-1" />);

    const accept = screen.getByRole("button", { name: "Mentorluğu kabul et" });
    const themed = accept.closest<HTMLElement>('[style*="--ms-accent"]');
    expect(themed?.style.getPropertyValue("--ms-accent")).toBe("#26a4ff");
  });
});

it("shows the program captured on the request in its program field", () => {
  renderWithQueryClient(<MentorRequestStartupDetail requestId="req-1" />);
  expect(screen.getByText("QA Recorded Program")).toBeInTheDocument();
});
