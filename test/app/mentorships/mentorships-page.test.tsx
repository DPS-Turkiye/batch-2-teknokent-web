import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MentorshipsPage from "@/app/mentorships/page";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useDemoSession: () => null,
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));

function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "req-1",
    requesterId: "requester-1",
    organizationId: "org-1",
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

describe("MentorshipsPage", () => {
  it("lists every mentorship request, not just the dashboard's first two", () => {
    mockRequests([
      request({ id: "1", mentorName: "Leyla Aksoy" }),
      request({ id: "2", mentorName: "Ece Demir" }),
      request({ id: "3", mentorName: "Burak Yalçın" }),
    ]);

    renderWithQueryClient(<MentorshipsPage />);

    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    expect(screen.getByText("Ece Demir")).toBeInTheDocument();
    expect(screen.getByText("Burak Yalçın")).toBeInTheDocument();
  });

  it("links each request to its status detail page", () => {
    mockRequests([request({ id: "req-42" })]);

    renderWithQueryClient(<MentorshipsPage />);

    expect(
      screen.getByRole("link", { name: /İş modeli ve strateji/ }),
    ).toHaveAttribute("href", "/mentor-request/status?id=req-42");
  });

  it("shows an empty state when there are no requests", () => {
    mockRequests([]);

    renderWithQueryClient(<MentorshipsPage />);

    expect(
      screen.getByText("Henüz bir mentorluk talebiniz yok."),
    ).toBeInTheDocument();
  });

  it("shows a loading state while the query is in flight", () => {
    mockRequests([], { isLoading: true });

    renderWithQueryClient(<MentorshipsPage />);

    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });
});
