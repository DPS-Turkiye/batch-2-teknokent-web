import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { DASHBOARD_REQUEST_STATUS_LABELS } from "@/lib/const";

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
    isLoadingActionItems: false,
    openActionItems: [],
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

function section(heading: string) {
  return within(
    screen
      .getByRole("heading", { name: heading })
      .closest("section") as HTMLElement,
  );
}

const pendingRequest = {
  id: "req-2",
  mentorName: "Ahmet Yılmaz",
  supportArea: "Finans",
  status: MentorshipRequestStatus.Pending,
};

const activeRequest = {
  id: "req-1",
  mentorName: "Leyla Aksoy",
  supportArea: "İş modeli ve strateji",
  status: MentorshipRequestStatus.Accepted,
};

describe("Mentee dashboard", () => {
  it("invites the mentee to find a mentor", () => {
    mockUseDashboardData.mockReturnValue(dashboardData());

    render(<DashboardPage />);

    expect(
      screen.getByRole("heading", {
        name: "Mentorluk Yolculuğuna Hazır Mısın?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Doğru mentor ile buluş/ }),
    ).toHaveAttribute("href", "/mentor-request");
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

  it("offers five quick actions, each with its destination", () => {
    mockUseDashboardData.mockReturnValue(dashboardData());

    render(<DashboardPage />);

    const quickActions = section("Hızlı İşlemler");
    expect(quickActions.getAllByRole("link")).toHaveLength(5);
    expect(
      quickActions.getByRole("link", { name: /Mentor bul/ }),
    ).toHaveAttribute("href", "/mentor-request");
    expect(
      quickActions.getByRole("link", { name: /Toplantı planla/ }),
    ).toHaveAttribute("href", "/calendar");
    expect(
      quickActions.getByRole("link", { name: /Mesaj gönder/ }),
    ).toHaveAttribute("href", "/messages");
  });

  it("lists pending requests and open tasks under Senden Beklenenler", () => {
    mockUseDashboardData.mockReturnValue(
      dashboardData({
        requests: [pendingRequest],
        openActionItems: [
          {
            id: "task-1",
            title: "Pitch deck'i güncelle",
            dueDate: "2026-09-18",
            organizationName: "GreenLoop",
          },
        ],
      } as Partial<DashboardData>),
    );

    render(<DashboardPage />);

    const expected = section("Senden Beklenenler");
    expect(expected.getByText("2")).toBeInTheDocument();
    expect(
      expected.getByRole("link", { name: /Mentor talebini takip et/ }),
    ).toHaveAttribute("href", "/mentor-request/status?id=req-2");
    expect(
      expected.getByText(
        DASHBOARD_REQUEST_STATUS_LABELS[pendingRequest.status],
      ),
    ).toBeInTheDocument();
    expect(
      expected.getByRole("link", { name: /Pitch deck'i güncelle/ }),
    ).toHaveAttribute("href", "/mentorships");
    expect(expected.getByText("18 Eylül")).toBeInTheDocument();
  });

  it("shows empty states only once loading has finished", () => {
    mockUseDashboardData.mockReturnValue(dashboardData({ isLoading: true }));
    const { unmount } = render(<DashboardPage />);
    expect(
      screen.queryByText("Şu anda bekleyen bir görevin yok."),
    ).not.toBeInTheDocument();
    unmount();

    mockUseDashboardData.mockReturnValue(dashboardData());
    render(<DashboardPage />);
    expect(
      screen.getByText("Şu anda bekleyen bir görevin yok."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Yaklaşan görüşme bulunmuyor."),
    ).toBeInTheDocument();
    expect(screen.getByText("Henüz aktif mentorluk yok.")).toBeInTheDocument();
    expect(screen.getByText("Bekleyen talep yok.")).toBeInTheDocument();
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

    const upcoming = section("Yaklaşanlar");
    expect(upcoming.getByText("Finansal model görüşmesi")).toBeInTheDocument();
    expect(upcoming.getByText(/Leyla Aksoy/)).toBeInTheDocument();
    expect(upcoming.getByRole("link", { name: "Katıl" })).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );
  });

  it("links each active mentorship to its own status page", () => {
    mockUseDashboardData.mockReturnValue(
      dashboardData({
        requests: [activeRequest, pendingRequest],
      } as Partial<DashboardData>),
    );

    render(<DashboardPage />);

    expect(
      section("Aktif Mentorluklar").getByRole("link", { name: /Leyla Aksoy/ }),
    ).toHaveAttribute("href", "/mentor-request/status?id=req-1");
    const pending = section("Bekleyen Mentorluk Talepleri");
    expect(pending.getByText("1")).toBeInTheDocument();
    expect(pending.getByRole("link", { name: /Ahmet Yılmaz/ })).toHaveAttribute(
      "href",
      "/mentor-request/status?id=req-2",
    );
  });
});
