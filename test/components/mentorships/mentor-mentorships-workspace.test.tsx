import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorMentorshipsWorkspace } from "@/components/mentorships/mentor-mentorships-workspace";
import { useMeetings } from "@/hooks/use-meetings";
import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { updateMeeting } from "@/lib/client/meetings";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import { upcomingPreferenceDays } from "@/lib/mentor-availability-days";
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

vi.mock("@/lib/client/mentor-requests", () => ({
  logMentorshipMeeting: vi.fn(),
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

vi.mock("@/lib/client/meetings", () => ({
  updateMeeting: vi.fn(),
}));

vi.mock("@/lib/client/mentorships", () => ({
  getRegularMentorships: vi.fn(async () => []),
  searchOrganizations: vi.fn(async () => []),
  startRegularMentorship: vi.fn(),
}));

const mutateAsync = vi.fn();

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorRequestDecision: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: vi.fn(),
  MEETINGS_QUERY_KEY: ["meetings"],
}));

function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "req-1",
    requesterId: "requester-1",
    requesterName: "Gülse Buran",
    requestedForName: "Gülse Buran",
    organizationId: "org-1",
    organizationName: "Döngü",
    mentorId: "mentor-1",
    mentorName: "Leyla Aksoy",
    supportArea: "İş modeli ve strateji",
    summary:
      "Matching ve gönüllülük değerini onboarding deneyiminde daha net göstermek istiyoruz.",
    requesterMessage:
      "MVP positioning ve onboarding önceliklerini netleştirmek\nTercih edilen saatler: 10 Eylül Perşembe · 13:00, 10 Eylül Perşembe · 10:30, 11 Eylül Cuma · 14:00\npreferredSlots:2026-09-10T13:00,2026-09-10T10:30,2026-09-11T14:00",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-09-09T07:42:00.000Z",
    messages: [],
    recommendationSnapshot: null,
    ...overrides,
  };
}

function mockPage(tab: keyof typeof pagesByTab, data: MentorshipRequest[]) {
  pagesByTab[tab] = data;
}

function mockRequests(data: MentorshipRequest[]) {
  const pendingish = new Set([
    MentorshipRequestStatus.Pending,
    MentorshipRequestStatus.MoreInfoRequested,
    MentorshipRequestStatus.CounterProposed,
  ]);
  const closed = new Set([
    MentorshipRequestStatus.Declined,
    MentorshipRequestStatus.Withdrawn,
  ]);
  mockPage(
    "requests",
    data.filter((item) => pendingish.has(item.status)),
  );
  mockPage(
    "active",
    data.filter((item) => item.status === MentorshipRequestStatus.Accepted),
  );
  mockPage(
    "history",
    data.filter((item) => closed.has(item.status)),
  );
}

describe("MentorMentorshipsWorkspace", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    vi.mocked(logMentorshipMeeting).mockReset();
    vi.mocked(updateMeeting).mockReset();
    mockPage("active", []);
    mockPage("requests", []);
    mockPage("history", []);
    vi.mocked(useMeetings).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);
  });

  it("hides capacity and create actions, and keeps completed mentorships on Geçmiş", async () => {
    const user = userEvent.setup();
    mockPage("active", [
      request({
        id: "active-1",
        status: MentorshipRequestStatus.Accepted,
      }),
    ]);
    mockPage("history", [
      request({
        id: "past-1",
        organizationName: "HubC",
        supportArea: "Büyüme Stratejisi",
        status: MentorshipRequestStatus.Accepted,
      }),
      request({
        id: "withdrawn-1",
        organizationName: "HubC",
        supportArea: "Satış",
        status: MentorshipRequestStatus.Withdrawn,
      }),
    ]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [
        {
          id: "open-meeting",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "active-1",
          scheduledAt: "2099-08-30T11:00:00.000Z",
          durationMinutes: 45,
          status: MeetingStatus.Scheduled,
        },
        {
          id: "ended-meeting",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "past-1",
          scheduledAt: "2020-01-01T10:00:00.000Z",
          durationMinutes: 45,
          status: MeetingStatus.Completed,
        },
      ],
      isLoading: false,
      error: null,
    } as never);

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    expect(screen.getByText("Mentorluklarım")).toBeInTheDocument();
    expect(screen.queryByText("Kapasiteyi yönet")).not.toBeInTheDocument();
    expect(screen.queryByText("Mentorluk Oluştur")).not.toBeInTheDocument();
    expect(screen.queryByText("Mentorluk oluştur")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Mentor Havuzu" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("Döngü")).toBeInTheDocument();
    expect(
      screen.queryByText("Yakın zamanda tamamlanan"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Geçmiş" }));
    expect(screen.getByText("Yakın zamanda tamamlanan")).toBeInTheDocument();
    expect(
      await screen.findByText(/HubC · Büyüme Stratejisi/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Görüşme hakkında bilgi" }),
    ).toHaveAttribute("href", "/meetings/research/about?id=ended-meeting");
    expect(
      screen.queryByRole("link", { name: "Görüşmeyi değerlendir" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentorluk geçmişi →" }),
    ).toHaveAttribute("href", "/mentor-dashboard/mentorship/withdrawn-1");
  });

  it("reviews a request, lets the mentor pick a preferred time, then moves it to Aktif", async () => {
    const user = userEvent.setup();
    const pending = request();
    mockRequests([pending]);
    mutateAsync.mockImplementation(async () => {
      mockRequests([
        request({ id: "req-1", status: MentorshipRequestStatus.Accepted }),
      ]);
      vi.mocked(useMeetings).mockReturnValue({
        data: [
          {
            id: "meeting-1",
            organizationId: "org-1",
            mentorId: "mentor-1",
            mentorshipRequestId: "req-1",
            scheduledAt: "2099-08-30T11:00:00.000Z",
            durationMinutes: 45,
            meetLink: "https://meet.google.com/abc-defg-hij",
            status: MeetingStatus.Scheduled,
          },
        ],
        isLoading: false,
        error: null,
      } as never);
    });
    vi.mocked(logMentorshipMeeting).mockResolvedValue({
      id: "meeting-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2099-08-30T11:00:00.000Z",
      durationMinutes: 45,
      meetLink: "https://meet.google.com/abc-defg-hij",
      status: "SCHEDULED",
    });

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(screen.getByRole("tab", { name: "Talepler" }));
    expect(await screen.findByText("Yeni talepler")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kabul et" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Talebi incele" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Talebi incele" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("Mentee’nin tercih ettiği saatler"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kabul et" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "10 Eylül Perşembe · 13:00" }),
    );
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "https://meet.google.com/abc-defg-hij",
    );
    await user.click(screen.getByRole("button", { name: "Kabul et" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "req-1",
      status: MentorshipRequestStatus.Accepted,
      message: "Görüşme saati: 2026-09-10T13:00",
    });
    expect(logMentorshipMeeting).toHaveBeenCalledWith(
      "req-1",
      expect.objectContaining({
        mentorId: "mentor-1",
        durationMinutes: 45,
        meetLink: "https://meet.google.com/abc-defg-hij",
        transcribeRequested: false,
      }),
    );
    expect(screen.getByRole("tab", { name: "Aktif" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("Döngü")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets the mentor propose alternative times instead of accepting mentee slots", async () => {
    const user = userEvent.setup();
    mockRequests([request()]);
    mutateAsync.mockResolvedValue(
      request({ status: MentorshipRequestStatus.CounterProposed }),
    );
    const day = upcomingPreferenceDays()[0]?.value;
    expect(day).toBeTruthy();

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(screen.getByRole("tab", { name: "Talepler" }));
    await user.click(screen.getByRole("button", { name: "Talebi incele" }));
    await user.click(
      screen.getByRole("button", { name: "Kendi saatimi öner" }),
    );

    await user.selectOptions(screen.getByLabelText("1. öneri günü"), day!);
    const timeInput = screen.getByLabelText("1. öneri saati");
    await user.clear(timeInput);
    await user.type(timeInput, "15:00");
    await user.click(screen.getByRole("button", { name: "Önerileri gönder" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "req-1",
      status: MentorshipRequestStatus.CounterProposed,
      message: expect.stringContaining(`proposedSlots:${day}T15:00`),
    });
    expect(logMentorshipMeeting).not.toHaveBeenCalled();
  });

  it("shows waiting state when mentor already proposed alternative times", async () => {
    const user = userEvent.setup();
    mockRequests([
      request({
        status: MentorshipRequestStatus.CounterProposed,
        mentorMessage:
          "proposedSlots:2026-09-12T15:00\nMentörün önerdiği saatler: 12 Eylül Cumartesi · 15:00",
      }),
    ]);

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(screen.getByRole("tab", { name: "Talepler" }));
    expect(screen.getByText("Mentee yanıtı bekleniyor")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Talebi incele" }),
    ).not.toBeInTheDocument();
  });

  it("lets the mentor add a meet link later from Aktif", async () => {
    const user = userEvent.setup();
    mockRequests([
      request({ id: "req-1", status: MentorshipRequestStatus.Accepted }),
    ]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [
        {
          id: "meeting-open",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "req-1",
          scheduledAt: "2099-08-30T11:00:00.000Z",
          durationMinutes: 45,
          meetLink: null,
          status: MeetingStatus.Scheduled,
        },
      ],
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(updateMeeting).mockResolvedValue({
      id: "meeting-open",
      organizationId: "org-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2099-08-30T11:00:00.000Z",
      durationMinutes: 45,
      meetLink: "https://meet.google.com/xyz",
      status: MeetingStatus.Scheduled,
    });

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(
      await screen.findByRole("button", { name: "Meet linki ekle" }),
    );
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "https://meet.google.com/xyz",
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(updateMeeting).toHaveBeenCalledWith("meeting-open", {
      meetLink: "https://meet.google.com/xyz",
      transcribeRequested: false,
    });
  });

  it("requests a transcript bot when the mentor checks the box on accept", async () => {
    const user = userEvent.setup();
    mockRequests([request()]);
    mutateAsync.mockResolvedValue({});
    vi.mocked(logMentorshipMeeting).mockResolvedValue({
      id: "meeting-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2026-09-10T13:00:00.000Z",
      durationMinutes: 45,
      meetLink: "https://meet.google.com/abc-defg-hij",
      status: "SCHEDULED",
    });

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(screen.getByRole("tab", { name: "Talepler" }));
    await user.click(screen.getByRole("button", { name: "Talebi incele" }));
    await user.click(
      screen.getByRole("button", { name: "10 Eylül Perşembe · 13:00" }),
    );
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "https://meet.google.com/abc-defg-hij",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /Toplantının transkriptinin çıkarılmasını istiyorum/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Kabul et" }));

    expect(logMentorshipMeeting).toHaveBeenCalledWith(
      "req-1",
      expect.objectContaining({
        meetLink: "https://meet.google.com/abc-defg-hij",
        transcribeRequested: true,
      }),
    );
  });

  it("requests a transcript bot when the mentor checks the box while adding a meet link", async () => {
    const user = userEvent.setup();
    mockRequests([
      request({ id: "req-1", status: MentorshipRequestStatus.Accepted }),
    ]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [
        {
          id: "meeting-open",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "req-1",
          scheduledAt: "2099-08-30T11:00:00.000Z",
          durationMinutes: 45,
          meetLink: null,
          status: MeetingStatus.Scheduled,
        },
      ],
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(updateMeeting).mockResolvedValue({
      id: "meeting-open",
      organizationId: "org-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2099-08-30T11:00:00.000Z",
      durationMinutes: 45,
      meetLink: "https://meet.google.com/xyz",
      transcribeRequested: true,
      status: MeetingStatus.Scheduled,
    });

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(
      await screen.findByRole("button", { name: "Meet linki ekle" }),
    );
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "https://meet.google.com/xyz",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /Toplantının transkriptinin çıkarılmasını istiyorum/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(updateMeeting).toHaveBeenCalledWith("meeting-open", {
      meetLink: "https://meet.google.com/xyz",
      transcribeRequested: true,
    });
  });

  it("turns on transcription when editing an existing meet link", async () => {
    const user = userEvent.setup();
    mockRequests([
      request({ id: "req-1", status: MentorshipRequestStatus.Accepted }),
    ]);
    vi.mocked(useMeetings).mockReturnValue({
      data: [
        {
          id: "meeting-1",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "req-1",
          scheduledAt: "2099-08-30T11:00:00.000Z",
          durationMinutes: 45,
          meetLink: "https://meet.google.com/old-old-old",
          transcribeRequested: false,
          status: MeetingStatus.Scheduled,
        },
      ],
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(updateMeeting).mockResolvedValue({
      id: "meeting-1",
      organizationId: "org-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2099-08-30T11:00:00.000Z",
      durationMinutes: 45,
      meetLink: "https://meet.google.com/xyz",
      transcribeRequested: true,
      status: MeetingStatus.Scheduled,
    });

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(
      await screen.findByRole("button", { name: "Meet linkini düzenle" }),
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /Toplantının transkriptinin çıkarılmasını istiyorum/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(updateMeeting).toHaveBeenCalledWith("meeting-1", {
      meetLink: "https://meet.google.com/old-old-old",
      transcribeRequested: true,
    });
  });
});
