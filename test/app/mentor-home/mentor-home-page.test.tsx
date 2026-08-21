import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MentorHomePage from "@/app/mentor-home/page";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { SessionRole, type DemoSession } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useDemoSession: () => mockUseDemoSession(),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));

const mockUseDemoSession = vi.fn<() => DemoSession | null>();

function mentorSession(): DemoSession {
  return {
    userId: "mentor-1",
    email: "leyla.aksoy@teknokent.demo",
    fullName: "Leyla Aksoy",
    jobTitle: "Mentor",
    role: SessionRole.Mentor,
  };
}

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
    status: MentorshipRequestStatus.Accepted,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-08-17T09:49:54.374504Z",
    messages: [],
    ...overrides,
  };
}

function mockRequests(
  data: MentorshipRequest[],
  overrides: Partial<ReturnType<typeof useMentorshipRequests>> = {},
) {
  vi.mocked(useMentorshipRequests).mockReturnValue({
    data,
    isLoading: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useMentorshipRequests>);
}

describe("MentorHomePage", () => {
  it("greets the logged-in mentor and shows the pending count", () => {
    mockUseDemoSession.mockReturnValue(mentorSession());
    mockRequests([
      request({ id: "1", status: MentorshipRequestStatus.Pending }),
      request({ id: "2", status: MentorshipRequestStatus.Pending }),
    ]);

    renderWithQueryClient(<MentorHomePage />);

    expect(screen.getByText("Hoş geldin, Leyla Aksoy")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByText("2 talep yanıtınızı bekliyor."),
    ).toBeInTheDocument();
  });

  it("links each accepted mentorship to its timeline page", () => {
    mockUseDemoSession.mockReturnValue(mentorSession());
    mockRequests([request({ id: "req-1", organizationName: "GreenLoop" })]);

    renderWithQueryClient(<MentorHomePage />);

    const link = screen.getByRole("link", { name: /GreenLoop/ });
    expect(link).toHaveAttribute("href", "/mentor-dashboard/mentorship/req-1");
  });

  it("shows an empty state when there are no accepted mentorships", () => {
    mockUseDemoSession.mockReturnValue(mentorSession());
    mockRequests([]);

    renderWithQueryClient(<MentorHomePage />);

    expect(
      screen.getByText("Henüz kabul edilmiş bir mentorluk talebiniz yok."),
    ).toBeInTheDocument();
    expect(screen.getByText("Bekleyen talep bulunmuyor.")).toBeInTheDocument();
  });
});
