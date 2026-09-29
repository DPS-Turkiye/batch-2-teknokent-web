import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { DueTone, HomeTaskKind, SentRequestState } from "@/types/mentee-home";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";

type DashboardData = ReturnType<
  typeof import("@/hooks/use-dashboard-data").useDashboardData
>;

const mockUseDashboardData = vi.fn<() => DashboardData>();

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/dashboard/my-programs-panel", () => ({
  MyProgramsPanel: () => (
    <section aria-labelledby="home-programs-title">
      <h2 id="home-programs-title">Programlarım</h2>
    </section>
  ),
}));

vi.mock("@/components/meeting-proposal-cards", () => ({
  MeetingProposalCards: () => <section aria-label="Görüşme önerileri" />,
}));

vi.mock("@/hooks/use-dashboard-data", () => ({
  useDashboardData: () => mockUseDashboardData(),
}));

function dashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    activeRequests: [],
    displayName: "Gülse",
    greeting: "Günaydın",
    heldMeetingCount: 0,
    homeTasks: [],
    organizationName: "GreenLoop",
    isFallback: false,
    isLoading: false,
    isLoadingActionItems: false,
    isLoadingFeedback: false,
    dismissHomeTask: vi.fn(),
    nextMeeting: null,
    nextMeetingByRequest: {},
    noteMeetings: [],
    openActionCountByRequest: {},
    openActionItems: [],
    openTodoCounts: new Map<string, number>(),
    otherUpcomingMeetings: [],
    pendingRequests: [],
    requests: [],
    requestsById: {},
    sentRequests: [],
    upcomingMeetings: [],
    ...overrides,
  };
}

function section(heading: string) {
  return within(
    screen
      .getByRole("heading", { name: heading })
      .closest("section") as HTMLElement,
  );
}

beforeEach(() => {
  mockUseDashboardData.mockReset();
});

describe("Mentee dashboard", () => {
  it("greets the mentee by first name", () => {
    mockUseDashboardData.mockReturnValue(dashboardData());

    render(<DashboardPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Günaydın, Gülse" }),
    ).toBeInTheDocument();
  });

  it("warns only when the queries actually failed, never while loading", () => {
    const warning = "Veriler yüklenemedi. Daha sonra yeniden dene.";

    mockUseDashboardData.mockReturnValue(dashboardData({ isLoading: true }));
    const { unmount } = render(<DashboardPage />);
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
    unmount();

    mockUseDashboardData.mockReturnValue(dashboardData({ isFallback: true }));
    render(<DashboardPage />);
    expect(screen.getByText(warning)).toBeInTheDocument();
  });

  it("lays out every section of the design", () => {
    mockUseDashboardData.mockReturnValue(dashboardData());

    render(<DashboardPage />);

    expect(
      screen.getByRole("region", { name: "Sıradaki görüşme" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Hızlı işlemler" }),
    ).toBeInTheDocument();
    for (const heading of [
      "Yapılacaklar",
      "Yaklaşan görüşmeler",
      "Toplantı Notların",
      "Gönderdiğin talepler",
      "Aktif Mentorluklar",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }
  });

  it("puts meeting proposals under the next meeting banner", () => {
    mockUseDashboardData.mockReturnValue(dashboardData());

    render(<DashboardPage />);

    const hero = screen.getByRole("region", { name: "Sıradaki görüşme" });
    const proposals = screen.getByRole("region", { name: "Görüşme önerileri" });
    expect(
      hero.compareDocumentPosition(proposals) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows empty states only once loading has finished", () => {
    mockUseDashboardData.mockReturnValue(dashboardData({ isLoading: true }));
    const { unmount } = render(<DashboardPage />);
    expect(
      screen.queryByText("Şu anda yapılacak bir işin yok."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Bekleyen talebin yok.")).not.toBeInTheDocument();
    unmount();

    mockUseDashboardData.mockReturnValue(dashboardData());
    render(<DashboardPage />);
    expect(
      screen.getByText("Şu anda yapılacak bir işin yok."),
    ).toBeInTheDocument();
    expect(screen.getByText("Bekleyen talebin yok.")).toBeInTheDocument();
    expect(screen.getByText("Henüz aktif mentorluk yok.")).toBeInTheDocument();
  });

  it("passes the hook's tasks and requests to their sections", () => {
    const request = menteeRequestFixture({
      id: "req-1",
      status: MentorshipRequestStatus.MoreInfoRequested,
    });
    mockUseDashboardData.mockReturnValue(
      dashboardData({
        homeTasks: [
          {
            id: "request-req-1",
            kind: HomeTaskKind.RequestReply,
            title: "Mentor talebini yanıtla",
            subtitle: "Barış Öztürk · Teknik ekip kurulumu",
            dueTone: DueTone.Today,
            dueLabel: "Bilgi bekliyor",
            actionLabel: "Yanıtla",
            href: "/mentor-request/status?id=req-1",
          },
        ],
        sentRequests: [{ request, state: SentRequestState.ActionNeeded }],
      }),
    );

    render(<DashboardPage />);

    expect(
      section("Yapılacaklar").getByRole("link", {
        name: "Yanıtla: Mentor talebini yanıtla",
      }),
    ).toHaveAttribute("href", "/mentor-request/status?id=req-1");
    expect(
      section("Gönderdiğin talepler").getByRole("link", {
        name: "Talebi yanıtla",
      }),
    ).toHaveAttribute("href", "/mentor-request/status?id=req-1");
  });
});
