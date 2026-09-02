import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorshipsPage from "@/app/mentorships/page";
import { useMentors } from "@/hooks/use-mentors";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import type { MentorProfile } from "@/interfaces/mentor";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { mentorProfile } from "@test/fixtures/mentors";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => null,
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));

vi.mock("@/hooks/use-mentors", () => ({
  useMentors: vi.fn(),
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
    recommendationSnapshot: null,
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
  } as unknown as ReturnType<typeof useMentorshipRequests>);
}

function mockMentors(
  data: MentorProfile[],
  overrides: Partial<ReturnType<typeof useMentors>> = {},
) {
  vi.mocked(useMentors).mockReturnValue({
    data,
    isLoading: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useMentors>);
}

describe("MentorshipsPage", () => {
  beforeEach(() => {
    mockMentors([]);
  });

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

  it("separates pending requests into the Talepler tab", async () => {
    const user = userEvent.setup();
    mockRequests([
      request({
        id: "pending-1",
        mentorName: "Ece Demir",
        status: MentorshipRequestStatus.Pending,
      }),
    ]);

    renderWithQueryClient(<MentorshipsPage />);
    expect(screen.queryByText("Ece Demir")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Talepler" }));
    expect(screen.getByText("Ece Demir")).toBeInTheDocument();
  });

  it("lists backend mentors on the Mentor Havuzu tab", async () => {
    mockMentors([mentorProfile]);
    const user = userEvent.setup();
    mockRequests([]);

    renderWithQueryClient(<MentorshipsPage />);
    await user.click(screen.getByRole("tab", { name: "Mentor Havuzu" }));

    expect(
      screen.getByRole("link", { name: /Dr. Kemal Arslan/ }),
    ).toHaveAttribute("href", `/mentors/${mentorProfile.id}`);
    expect(screen.queryByText(/Maks\./)).not.toBeInTheDocument();
  });
});
