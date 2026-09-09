import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorMentorshipsWorkspace } from "@/components/mentorships/mentor-mentorships-workspace";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/client/mentor-requests", () => ({
  logMentorshipMeeting: vi.fn(),
}));

vi.mock("@/lib/client/meetings", () => ({
  updateMeeting: vi.fn(),
}));

const mutateAsync = vi.fn();

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
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

function mockRequests(data: MentorshipRequest[]) {
  vi.mocked(useMentorshipRequests).mockReturnValue({
    data,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useMentorshipRequests>);
}

describe("MentorMentorshipsWorkspace", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    vi.mocked(logMentorshipMeeting).mockReset();
    vi.mocked(useMeetings).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);
  });

  it("hides capacity and create actions, and keeps completed mentorships on Geçmiş", async () => {
    const user = userEvent.setup();
    mockRequests([
      request({
        id: "active-1",
        status: MentorshipRequestStatus.Accepted,
      }),
      request({
        id: "past-1",
        organizationName: "HubC",
        supportArea: "Büyüme Stratejisi",
        status: MentorshipRequestStatus.Withdrawn,
      }),
    ]);

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    expect(screen.getByText("Mentorluklarım")).toBeInTheDocument();
    expect(screen.queryByText("Kapasiteyi yönet")).not.toBeInTheDocument();
    expect(screen.queryByText("Mentorluk Oluştur")).not.toBeInTheDocument();
    expect(screen.queryByText("Mentorluk oluştur")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Mentor Havuzu" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Döngü")).toBeInTheDocument();
    expect(
      screen.queryByText("Yakın zamanda tamamlanan"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Geçmiş" }));
    expect(screen.getByText("Yakın zamanda tamamlanan")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /HubC · Büyüme Stratejisi/ }),
    ).toHaveAttribute("href", "/mentor-dashboard/mentorship/past-1");
  });

  it("reviews a request, lets the mentor pick a preferred time, then moves it to Aktif", async () => {
    const user = userEvent.setup();
    const pending = request();
    mockRequests([pending]);
    mutateAsync.mockImplementation(async () => {
      mockRequests([
        request({ id: "req-1", status: MentorshipRequestStatus.Accepted }),
      ]);
    });
    vi.mocked(logMentorshipMeeting).mockResolvedValue({
      id: "meeting-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2026-09-10T10:00:00.000Z",
      durationMinutes: 45,
      meetLink: null,
      status: "SCHEDULED",
    });

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(screen.getByRole("tab", { name: "Talepler" }));
    expect(screen.getByText("Yeni talepler")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kabul et" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Talebi incele" }),
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
      message: "Görüşme saati: 10 Eylül Perşembe · 13:00",
    });
    expect(logMentorshipMeeting).toHaveBeenCalledWith(
      "req-1",
      expect.objectContaining({
        mentorId: "mentor-1",
        durationMinutes: 45,
        meetLink: "https://meet.google.com/abc-defg-hij",
      }),
    );
    expect(screen.getByRole("tab", { name: "Aktif" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Döngü")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets the mentor add a meet link later from Aktif", async () => {
    const user = userEvent.setup();
    mockRequests([
      request({ id: "req-1", status: MentorshipRequestStatus.Accepted }),
    ]);
    vi.mocked(logMentorshipMeeting).mockResolvedValue({
      id: "meeting-2",
      mentorshipRequestId: "req-1",
      scheduledAt: "2026-09-10T10:00:00.000Z",
      durationMinutes: 45,
      meetLink: "https://meet.google.com/xyz",
      status: "SCHEDULED",
    });

    renderWithQueryClient(<MentorMentorshipsWorkspace />);

    await user.click(screen.getByRole("button", { name: "Meet linki ekle" }));
    await user.type(
      screen.getByPlaceholderText("https://meet.google.com/..."),
      "https://meet.google.com/xyz",
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(logMentorshipMeeting).toHaveBeenCalledWith(
      "req-1",
      expect.objectContaining({
        meetLink: "https://meet.google.com/xyz",
      }),
    );
  });
});
