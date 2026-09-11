import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorshipsPage from "@/app/mentorships/page";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentors } from "@/hooks/use-mentors";
import type { MentorProfile } from "@/interfaces/mentor";
import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { mentorProfile } from "@test/fixtures/mentors";
import { renderWithQueryClient } from "@test/test-utils";

const pagesByTab = vi.hoisted(() => ({
  active: [] as MentorshipRequest[],
  requests: [] as MentorshipRequest[],
  history: [] as MentorshipRequest[],
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/mentorships",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => null,
}));

vi.mock("@/hooks/use-mentors", () => ({
  useMentors: vi.fn(),
}));

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: vi.fn(),
  MEETINGS_QUERY_KEY: ["meetings"],
}));

vi.mock("@/lib/client/meetings", () => ({
  getMeetingFeedback: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorRequestsPage: vi.fn(
    async ({ tab }: { tab: keyof typeof pagesByTab }) => {
      const content = pagesByTab[tab] ?? [];
      return {
        content,
        page: 0,
        size: 7,
        totalElements: content.length,
        totalPages: Math.max(1, Math.ceil(content.length / 7) || 1),
      };
    },
  ),
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

function mockPage(tab: keyof typeof pagesByTab, data: MentorshipRequest[]) {
  pagesByTab[tab] = data;
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
    mockPage("active", []);
    mockPage("requests", []);
    mockPage("history", []);
    vi.mocked(useMeetings).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);
  });

  function openMeeting(
    requestId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return {
      id: `meeting-${requestId}`,
      organizationId: "org-1",
      mentorId: "mentor-1",
      mentorshipRequestId: requestId,
      scheduledAt: "2099-08-30T11:00:00.000Z",
      durationMinutes: 45,
      meetLink: null,
      status: MeetingStatus.Scheduled,
      ...overrides,
    };
  }

  it("lists every mentorship request, not just the dashboard's first two", async () => {
    mockPage("active", [
      request({ id: "1", mentorName: "Leyla Aksoy" }),
      request({ id: "2", mentorName: "Ece Demir", mentorId: "mentor-2" }),
      request({ id: "3", mentorName: "Burak Yalçın", mentorId: "mentor-3" }),
    ]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [
        openMeeting("1"),
        openMeeting("2", { mentorId: "mentor-2" }),
        openMeeting("3", { mentorId: "mentor-3" }),
      ],
      isLoading: false,
      error: null,
    } as never);

    renderWithQueryClient(<MentorshipsPage />);

    await waitFor(() => {
      expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    });
    expect(screen.getByText("Ece Demir")).toBeInTheDocument();
    expect(screen.getByText("Burak Yalçın")).toBeInTheDocument();
  });

  it("links each request to its status detail page", async () => {
    mockPage("active", [request({ id: "req-42" })]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [openMeeting("req-42")],
      isLoading: false,
      error: null,
    } as never);

    renderWithQueryClient(<MentorshipsPage />);

    expect(
      await screen.findByRole("link", { name: "Mentorluğa git →" }),
    ).toHaveAttribute("href", "/mentor-request/status?id=req-42");
  });

  it("shows the meeting link on the Aktif tab for the whole startup", async () => {
    mockPage("active", [request({ id: "req-42" })]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [
        openMeeting("req-42", {
          id: "meeting-1",
          meetLink: "https://meet.google.com/abc-defg-hij",
        }),
      ],
      isLoading: false,
      error: null,
    } as never);

    renderWithQueryClient(<MentorshipsPage />);

    expect(
      await screen.findByRole("link", {
        name: "https://meet.google.com/abc-defg-hij",
      }),
    ).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
  });

  it("shows an empty state when there are no active mentorships", async () => {
    mockPage("active", []);

    renderWithQueryClient(<MentorshipsPage />);

    expect(
      await screen.findByText("Aktif Mentörlüğünüz Bulunmamaktadır"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/Mentor, uzmanlık veya konu ara/),
    ).not.toBeInTheDocument();
  });

  it("shows a loading state while the query is in flight", () => {
    vi.mocked(useMeetings).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    } as never);

    renderWithQueryClient(<MentorshipsPage />);

    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("separates pending requests into the Talepler tab", async () => {
    const user = userEvent.setup();
    mockPage("active", []);
    mockPage("requests", [
      request({
        id: "pending-1",
        mentorName: "Ece Demir",
        status: MentorshipRequestStatus.Pending,
      }),
    ]);

    renderWithQueryClient(<MentorshipsPage />);
    expect(screen.queryByText("Ece Demir")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Talepler" }));
    expect(await screen.findByText("Ece Demir")).toBeInTheDocument();
  });

  it("lists backend mentors on the Mentor Havuzu tab", async () => {
    mockMentors([mentorProfile]);
    const user = userEvent.setup();

    renderWithQueryClient(<MentorshipsPage />);
    await user.click(screen.getByRole("tab", { name: "Mentor Havuzu" }));

    expect(
      screen.getByRole("link", { name: /Dr. Kemal Arslan/ }),
    ).toHaveAttribute("href", `/mentors/${mentorProfile.id}`);
    expect(screen.queryByText(/Maks\./)).not.toBeInTheDocument();
  });

  it("moves ended meetings to Geçmiş with info and evaluate links", async () => {
    const user = userEvent.setup();
    mockPage("active", [
      request({
        id: "active-1",
        mentorName: "Nihan Öztürk",
        supportArea: "UX/UI & Ürün Konumlandırma",
      }),
    ]);
    mockPage("history", [
      request({
        id: "past-1",
        mentorId: "mentor-past",
        mentorName: "Deniz Aksoy",
        supportArea: "Büyüme Stratejisi",
      }),
      request({
        id: "withdrawn-1",
        mentorName: "Ayşe Kara",
        supportArea: "Satış",
        status: MentorshipRequestStatus.Withdrawn,
      }),
    ]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [
        openMeeting("active-1"),
        {
          id: "ended-meeting",
          organizationId: "org-1",
          mentorId: "mentor-past",
          mentorshipRequestId: "past-1",
          scheduledAt: "2020-01-01T10:00:00.000Z",
          durationMinutes: 45,
          status: MeetingStatus.Completed,
        },
      ],
      isLoading: false,
      error: null,
    } as never);

    renderWithQueryClient(<MentorshipsPage />);

    expect(await screen.findByText("Nihan Öztürk")).toBeInTheDocument();
    expect(screen.getByText("Mentorluğa git →")).toBeInTheDocument();
    expect(
      screen.queryByText("Yakın zamanda tamamlanan"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Deniz Aksoy/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Geçmiş" }));

    expect(screen.getByText("Yakın zamanda tamamlanan")).toBeInTheDocument();
    expect(
      await screen.findByText(/Deniz Aksoy · Büyüme Stratejisi/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Görüşme hakkında bilgi" }),
    ).toHaveAttribute("href", "/meetings/research/summary?id=ended-meeting");
    expect(
      await screen.findByRole("link", { name: "Görüşmeyi değerlendir" }),
    ).toHaveAttribute("href", "/meetings/research/feedback?id=ended-meeting");
    expect(screen.getByText(/Ayşe Kara · Satış/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Talebi aç →" })).toHaveAttribute(
      "href",
      "/mentor-request/status?id=withdrawn-1",
    );
    expect(screen.queryByText("Nihan Öztürk")).not.toBeInTheDocument();
  });
});
