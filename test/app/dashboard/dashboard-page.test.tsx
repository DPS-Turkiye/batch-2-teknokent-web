import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";

type DashboardData = ReturnType<
  typeof import("@/hooks/use-dashboard-data").useDashboardData
>;

const mockUseDashboardData = vi.fn<() => DashboardData>();

vi.mock("@/hooks/use-dashboard-data", () => ({
  useDashboardData: () => mockUseDashboardData(),
}));

vi.mock("@/hooks/use-dashboard-notifications", () => ({
  useDashboardNotifications: () => ({ notifications: [] }),
}));

// The dashboard now renders the program picker, which has its own tests. Stub it
// here so these assertions stay about the dashboard.
vi.mock("@/components/dashboard/active-program-picker", () => ({
  ActiveProgramPicker: () => null,
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function dashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  const requests = overrides.requests ?? [];
  return {
    activeRequests: requests.filter(
      (request) => request.status === MentorshipRequestStatus.Accepted,
    ),
    displayName: "Deniz",
    organizationName: "GreenLoop",
    isFallback: false,
    isLoading: false,
    nextMeeting: null,
    pendingRequests: requests.filter(
      (request) => request.status === MentorshipRequestStatus.Pending,
    ),
    requests,
    upcomingMeetings: [],
    ...overrides,
  } as DashboardData;
}

beforeEach(() => {
  mockUseDashboardData.mockReset();
});

describe("Mentee dashboard", () => {
  it("greets the signed-in mentee by their first name", () => {
    mockUseDashboardData.mockReturnValue(dashboardData());

    render(<DashboardPage />);

    expect(screen.getByText(/Günaydın, Deniz/)).toBeInTheDocument();
  });

  it("shows the loading label in the hero while queries are in flight", () => {
    mockUseDashboardData.mockReturnValue(dashboardData({ isLoading: true }));

    render(<DashboardPage />);

    expect(screen.getByText("Toplantı yükleniyor")).toBeInTheDocument();
    expect(screen.queryByText("SIRADAKİ TOPLANTI")).not.toBeInTheDocument();
  });

  it("renders the next meeting in the hero once it resolves", () => {
    mockUseDashboardData.mockReturnValue(
      dashboardData({
        nextMeeting: {
          id: "meeting-1",
          agenda: "Finansal model görüşmesi",
          scheduledAt: "2026-09-02T13:30:00.000Z",
          durationMinutes: 45,
          meetLink: "https://meet.google.com/abc-defg-hij",
        },
      } as Partial<DashboardData>),
    );

    render(<DashboardPage />);

    expect(screen.getByText("SIRADAKİ TOPLANTI")).toBeInTheDocument();
    expect(screen.getAllByText("Finansal model görüşmesi")).not.toHaveLength(0);
    expect(screen.getByText("Google Meet")).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );
    expect(
      screen.getByRole("link", { name: /Toplantıya git/ }),
    ).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
  });

  it("prompts the mentee to plan a meeting when none is scheduled", () => {
    mockUseDashboardData.mockReturnValue(dashboardData({ nextMeeting: null }));

    render(<DashboardPage />);

    expect(screen.getByText("Yeni toplantını planla")).toBeInTheDocument();
    expect(
      screen.getByText("Planlanmış toplantı bulunmuyor."),
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

  it("links each mentorship request to its own status page", () => {
    mockUseDashboardData.mockReturnValue(
      dashboardData({
        activeRequests: [
          {
            id: "req-1",
            mentorName: "Leyla Aksoy",
            supportArea: "İş modeli ve strateji",
            status: MentorshipRequestStatus.Accepted,
          },
        ],
        requests: [
          {
            id: "req-1",
            mentorName: "Leyla Aksoy",
            supportArea: "İş modeli ve strateji",
            status: MentorshipRequestStatus.Accepted,
          },
        ],
      } as Partial<DashboardData>),
    );

    render(<DashboardPage />);

    const link = screen.getByRole("link", { name: /Leyla Aksoy/ });
    expect(link).toHaveAttribute("href", "/mentor-request/status?id=req-1");
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("İş modeli ve strateji")).toBeInTheDocument();
  });

  it("shows an empty state instead of request cards when there are none", () => {
    mockUseDashboardData.mockReturnValue(
      dashboardData({ activeRequests: [], requests: [] }),
    );

    render(<DashboardPage />);

    expect(
      screen.getByText("Henüz aktif bir mentorluk bulunmuyor."),
    ).toBeInTheDocument();
  });

  it("shows upcoming meeting time and a join link in Yaklaşanlar", () => {
    mockUseDashboardData.mockReturnValue(
      dashboardData({
        upcomingMeetings: [
          {
            id: "meeting-1",
            organizationId: "org-1",
            mentorName: "Leyla Aksoy",
            agenda: "Finansal model görüşmesi",
            scheduledAt: "2026-09-10T10:00:00.000Z",
            durationMinutes: 45,
            meetLink: "https://meet.google.com/abc-defg-hij",
            status: "SCHEDULED",
          },
        ],
      } as Partial<DashboardData>),
    );

    render(<DashboardPage />);

    expect(screen.getByText("Finansal model görüşmesi")).toBeInTheDocument();
    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Katıl" })).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );
  });

  it("offers exactly three quick actions, each with its own destination", () => {
    mockUseDashboardData.mockReturnValue(dashboardData());

    render(<DashboardPage />);

    const quickActions = within(
      screen
        .getByRole("heading", { name: "Hızlı işlemler" })
        .closest("section") as HTMLElement,
    );

    expect(quickActions.getAllByRole("link")).toHaveLength(3);
    expect(
      quickActions.getByRole("link", { name: /Mentor bul/ }),
    ).toHaveAttribute("href", "/mentor-request");
    expect(
      quickActions.getByRole("link", { name: /Toplantıya hazırlan/ }),
    ).toHaveAttribute("href", "/meetings/research/prepare");
    expect(
      quickActions.getByRole("link", { name: /Mentorluk taleplerim/ }),
    ).toHaveAttribute("href", "/mentorships");
  });
});
