import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorDashboardView } from "@/components/mentor-dashboard-view";
import { useDecision } from "@/hooks/use-decision";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole, type AppSession } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

const mockuseAppSession = vi.fn<() => AppSession | null>();

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockuseAppSession(),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));

vi.mock("@/hooks/use-decision", () => ({
  useDecision: vi.fn(),
}));

const mockUseMeetings = vi.fn();

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => mockUseMeetings(),
}));

vi.mock("@/hooks/use-programs", () => ({
  useProgramInvitations: () => ({ data: [], isLoading: false }),
  usePrograms: () => ({ data: [], isLoading: false }),
  useDecideProgramInvitation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRequestProgramMembership: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

function mentorSession(): AppSession {
  return {
    userId: "mentor-1",
    email: "leyla.aksoy@teknokent.demo",
    fullName: "Leyla Aksoy",
    jobTitle: "Mentor",
    role: UserRole.Mentor,
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
    status: MentorshipRequestStatus.Pending,
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

describe("MentorDashboardView", () => {
  const selectRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockuseAppSession.mockReturnValue(mentorSession());
    mockUseMeetings.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(useDecision).mockReturnValue({
      selectedRequest: null,
      decisionMode: null,
      decisionMessage: "",
      actionError: "",
      showAvailabilityStep: false,
      selectedSlots: [],
      isLoadingSlots: false,
      isPending: false,
      selectRequest,
      setDecisionMode: vi.fn(),
      setDecisionMessage: vi.fn(),
      closeDecision: vi.fn(),
      submitDecision: vi.fn(),
    } as ReturnType<typeof useDecision>);
  });

  it("greets the logged-in mentor and shows the pending count", () => {
    mockRequests([
      request({ id: "1", status: MentorshipRequestStatus.Pending }),
      request({ id: "2", status: MentorshipRequestStatus.Pending }),
    ]);

    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Merhaba Leyla,")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Yeni mentorluk talebi")).toBeInTheDocument();
  });

  it("links each accepted mentorship to its timeline page", () => {
    mockRequests([
      request({
        id: "req-1",
        organizationName: "GreenLoop",
        status: MentorshipRequestStatus.Accepted,
      }),
    ]);

    renderWithQueryClient(<MentorDashboardView />);

    const link = screen.getByRole("link", { name: /GreenLoop/ });
    expect(link).toHaveAttribute("href", "/mentor-dashboard/mentorship/req-1");
  });

  it("shows an empty state when there are no accepted mentorships", () => {
    mockRequests([]);

    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getByText("Henüz kabul edilmiş bir mentorluk talebiniz yok."),
    ).toBeInTheDocument();
    expect(screen.getByText("Bekleyen talep bulunmuyor.")).toBeInTheDocument();
  });

  it("shows upcoming meetings with time and a Google Meet join link", () => {
    mockRequests([]);
    mockUseMeetings.mockReturnValue({
      data: [
        {
          id: "meeting-1",
          organizationId: "org-1",
          organizationName: "GreenLoop",
          agenda: "Ürün incelemesi",
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          durationMinutes: 45,
          meetLink: "https://meet.google.com/abc-defg-hij",
          status: "SCHEDULED",
        },
      ],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Yaklaşan görüşmeler")).toBeInTheDocument();
    expect(screen.getByText("Ürün incelemesi")).toBeInTheDocument();
    expect(screen.getByText("GreenLoop")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Katıl →" })).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );
  });

  it("omits the old homepage sections covered by the workspace and account menus", () => {
    mockRequests([]);

    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.queryByText("Bildirimler")).not.toBeInTheDocument();
    expect(screen.queryByText("Programlar")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Gelen Mentorluk Talepleri"),
    ).not.toBeInTheDocument();
  });

  it("shows request errors instead of an empty state or zero counts", () => {
    mockRequests([], { error: new Error("unavailable") });

    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getAllByText(
        "Mentorluk talepleri yüklenemedi. Lütfen yeniden deneyin.",
      ),
    ).toHaveLength(3);
    expect(
      screen.queryByText("Bekleyen talep bulunmuyor."),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("opens the pending request from both attention and rail controls", async () => {
    mockRequests([
      request({ id: "1", status: MentorshipRequestStatus.Pending }),
      request({ id: "2", status: MentorshipRequestStatus.Declined }),
    ]);

    const user = userEvent.setup();
    renderWithQueryClient(<MentorDashboardView />);

    expect(useMentorshipRequests).toHaveBeenCalledWith(UserRole.Mentor);
    await user.click(screen.getByRole("button", { name: "Talebi incele" }));
    expect(selectRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "1" }),
    );
    await user.click(screen.getByRole("button", { name: /Mentorluğa git/ }));
    expect(selectRequest).toHaveBeenCalledTimes(2);
  });

  it("keeps loading counts distinct from zero and does not invent preparation data", () => {
    mockRequests([], { isLoading: true });
    mockUseMeetings.mockReturnValue({ data: [], isLoading: true, error: null });
    renderWithQueryClient(<MentorDashboardView />);
    expect(screen.getAllByText("…")).toHaveLength(3);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("Hazırlık güncellendi")).not.toBeInTheDocument();
  });
});
