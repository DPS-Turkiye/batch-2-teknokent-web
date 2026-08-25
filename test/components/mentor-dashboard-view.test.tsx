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
import { UserRole, type DemoSession } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

const mockUseDemoSession = vi.fn<() => DemoSession | null>();

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

vi.mock("@/hooks/use-decision", () => ({
  useDecision: vi.fn(),
}));

function mentorSession(): DemoSession {
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
    mockUseDemoSession.mockReturnValue(mentorSession());
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

    expect(screen.getByText("Hoş geldin, Leyla Aksoy")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByText("2 talep yanıtınızı bekliyor."),
    ).toBeInTheDocument();
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

  it("shows the demo notifications section for Duyurular to link to", () => {
    mockRequests([]);

    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Bildirimler")).toBeInTheDocument();
    expect(
      screen.getByText("Can Demir talebinizi kabul etti"),
    ).toBeInTheDocument();
  });

  it("links to the mentor profile page", () => {
    mockRequests([]);

    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Profili Görüntüle")).toHaveAttribute(
      "href",
      "/mentor-profile",
    );
  });

  it("filters the request list and opens the decision flow on review", async () => {
    mockRequests([
      request({ id: "1", status: MentorshipRequestStatus.Pending }),
      request({ id: "2", status: MentorshipRequestStatus.Declined }),
    ]);

    const user = userEvent.setup();
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("2 talep listeleniyor")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bekleyenler" }));
    expect(screen.getByText("1 talep listeleniyor")).toBeInTheDocument();

    await user.click(screen.getByText("Talebi İncele & Yanıtla →"));
    expect(selectRequest).toHaveBeenCalled();
  });
});
