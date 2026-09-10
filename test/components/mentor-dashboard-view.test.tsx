import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorDashboardView } from "@/components/mentor-dashboard-view";
import { useMentorDashboard } from "@/hooks/use-mentor-dashboard";
import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorDecisionMode,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentor-dashboard", () => ({
  useMentorDashboard: vi.fn(),
}));

function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "request-1",
    requesterId: "mentee-1",
    requesterName: "Selin Kaya",
    organizationId: "org-1",
    organizationName: "Kavun",
    mentorId: "mentor-1",
    mentorName: "Nihan Öztürk",
    supportArea: "UX Stratejisi",
    summary: "Onboarding akışını yeniden kurgulamak istiyoruz.",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-09-08T10:42:00.000Z",
    messages: [],
    recommendationSnapshot: {
      matchingMethod: "pgvector",
      matchingModel: null,
      generatedAt: "2026-09-08T10:42:00.000Z",
      startupName: "Kavun",
      startupSector: "B2C",
      startupStage: "Pre-seed",
      startupSummary: "Günlük alışkanlıkları takip eden bir mobil ürün.",
      startupTechnologies: ["Product Validation"],
    },
    ...overrides,
  };
}

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    organizationName: "Döngü",
    mentorshipRequestId: "request-1",
    scheduledAt: "2026-09-12T12:30:00.000Z",
    durationMinutes: 45,
    agenda: "UX Research Review",
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

function actionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: "action-1",
    organizationId: "org-1",
    organizationName: "Döngü",
    ownerId: "mentee-1",
    ownerName: "Gülse Buran",
    title: "Revize prototip",
    status: ActionItemStatus.Open,
    dueDate: "2026-09-20T09:00:00.000Z",
    createdAt: "2026-09-08T09:00:00.000Z",
    updatedAt: "2026-09-08T09:00:00.000Z",
    ...overrides,
  };
}

const submitDecision = vi.fn<(mode?: MentorDecisionMode) => Promise<boolean>>();
const selectRequest = vi.fn();
const closeDecision = vi.fn();

function decisionState(selectedRequest: MentorshipRequest | null = null) {
  return {
    selectedRequest,
    selectRequest,
    closeDecision,
    submitDecision,
    isPending: false,
  };
}

function mockDashboard(overrides: Record<string, unknown> = {}) {
  const value = {
    firstName: "Nihan",
    pending: [request()],
    accepted: [
      request({ id: "request-2", status: MentorshipRequestStatus.Accepted }),
    ],
    upcomingMeetings: [meeting()],
    weekMeetingCount: 1,
    mentorships: [
      {
        request: request({
          id: "request-2",
          organizationName: "Atlas AI",
          requesterName: "Emir Kaplan",
          supportArea: "Product Discovery",
          status: MentorshipRequestStatus.Accepted,
        }),
        actionItems: [actionItem({ id: "action-2", title: "Kullanıcı testi" })],
        openCount: 1,
        overdueCount: 0,
        progress: 40,
      },
    ],
    openActionItems: [actionItem()],
    awaitingReview: [
      meeting({
        id: "meeting-past",
        scheduledAt: "2026-09-01T12:30:00.000Z",
        agenda: "UX Flow Review",
      }),
    ],
    isLoadingActionItems: false,
    requestsQuery: { isLoading: false },
    meetingsQuery: { isLoading: false },
    decision: decisionState(),
    ...overrides,
  };
  vi.mocked(useMentorDashboard).mockReturnValue(
    value as unknown as ReturnType<typeof useMentorDashboard>,
  );
  return value;
}

describe("MentorDashboardView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitDecision.mockResolvedValue(true);
  });

  it("greets the signed-in mentor by first name", () => {
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Günaydın, Nihan")).toBeInTheDocument();
  });

  it("renders every dashboard section", () => {
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Bugün aksiyon bekleyen")).toBeInTheDocument();
    expect(screen.getByText("Yaklaşan görüşmeler")).toBeInTheDocument();
    expect(screen.getByText("Startup çalışmaları")).toBeInTheDocument();
    expect(screen.getByText("Mentorluk talepleri")).toBeInTheDocument();
    expect(
      screen.getByText("Değerlendirme bekleyen görüşmeler"),
    ).toBeInTheDocument();
  });

  it("lists pending mentorship requests from the API", () => {
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Kavun")).toBeInTheDocument();
    expect(screen.getByText("Selin Kaya")).toBeInTheDocument();
    expect(screen.getByText("UX Stratejisi")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tümü (1) →" }),
    ).toBeInTheDocument();
  });

  it("notes when no mentorship request is pending", () => {
    mockDashboard({ pending: [] });
    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getByText("Bekleyen mentorluk talebi yok."),
    ).toBeInTheDocument();
  });

  it("lists upcoming meetings with their duration", () => {
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    const card = screen.getByText("UX Research Review").closest("article");
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText(/45 dk/)).toBeInTheDocument();
  });

  it("notes when no meeting is upcoming", () => {
    mockDashboard({ upcomingMeetings: [] });
    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getByText("Yaklaşan görüşme bulunmuyor."),
    ).toBeInTheDocument();
  });

  it("shows a loading note while requests and meetings load", () => {
    mockDashboard({
      requestsQuery: { isLoading: true },
      meetingsQuery: { isLoading: true },
    });
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getAllByText("Yükleniyor...")).toHaveLength(4);
  });

  it("selects a request when its review button is used", async () => {
    const user = userEvent.setup();
    const value = mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    await user.click(screen.getByRole("button", { name: "Talebi incele" }));

    expect(selectRequest).toHaveBeenCalledWith(value.pending[0]);
  });

  it("shows the selected request's own detail in the drawer", () => {
    mockDashboard({ decision: decisionState(request()) });
    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getByRole("dialog", { name: "Mentorluk talebi" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Günlük alışkanlıkları takip eden bir mobil ürün."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Onboarding akışını yeniden kurgulamak istiyoruz."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pre-seed · B2C")).toBeInTheDocument();
  });

  it("accepts the selected request", async () => {
    const user = userEvent.setup();
    mockDashboard({ decision: decisionState(request()) });
    renderWithQueryClient(<MentorDashboardView />);

    await user.click(
      screen.getByRole("button", { name: "Mentorluğu kabul et" }),
    );

    expect(submitDecision).toHaveBeenCalledWith(MentorDecisionMode.Accept);
    expect(closeDecision).toHaveBeenCalled();
  });

  it("declines the selected request", async () => {
    const user = userEvent.setup();
    mockDashboard({ decision: decisionState(request()) });
    renderWithQueryClient(<MentorDashboardView />);

    await user.click(screen.getByRole("button", { name: "Reddet" }));

    expect(submitDecision).toHaveBeenCalledWith(MentorDecisionMode.Decline);
  });

  it("keeps the drawer open when the decision fails", async () => {
    const user = userEvent.setup();
    submitDecision.mockResolvedValue(false);
    mockDashboard({ decision: decisionState(request()) });
    renderWithQueryClient(<MentorDashboardView />);

    await user.click(
      screen.getByRole("button", { name: "Mentorluğu kabul et" }),
    );

    expect(closeDecision).not.toHaveBeenCalled();
  });

  it("lists the mentor's open action items", () => {
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Revize prototip")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tümü (1)" })).toBeInTheDocument();
  });

  it("notes when nothing is waiting for the mentor", () => {
    mockDashboard({ openActionItems: [] });
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Bekleyen bir iş yok.")).toBeInTheDocument();
  });

  it("lists meetings that still need a write-up", () => {
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Değerlendirme bekliyor")).toBeInTheDocument();
    expect(screen.getByText(/UX Flow Review/)).toBeInTheDocument();
  });

  it("notes when no meeting awaits review", () => {
    mockDashboard({ awaitingReview: [] });
    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getByText("Değerlendirme bekleyen görüşme yok."),
    ).toBeInTheDocument();
  });

  it("notes when the mentor has no active mentorship", () => {
    mockDashboard({ mentorships: [] });
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Aktif mentorluk yok.")).toBeInTheDocument();
  });

  it("keeps the quick actions linked to existing mentor routes", () => {
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getByRole("link", { name: /Toplantı planla.*Mentee/s }),
    ).toHaveAttribute("href", "/mentor-dashboard/calendar");
    expect(
      screen.getByRole("link", { name: /Mesaj gönder.*Aktif/s }),
    ).toHaveAttribute("href", "/mentor-dashboard/messages");
  });

  it("expands and collapses the startup progress card", async () => {
    const user = userEvent.setup();
    mockDashboard();
    renderWithQueryClient(<MentorDashboardView />);

    const toggle = screen.getByRole("button", { name: /Atlas AI.*%40/s });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Atanan işler")).toBeInTheDocument();
    expect(screen.getByText("Kullanıcı testi")).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText("Atanan işler")).not.toBeInTheDocument();
  });
});
