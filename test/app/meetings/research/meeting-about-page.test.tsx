import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MeetingAboutPage from "@/app/meetings/research/about/page";
import { useMeetingLifecycle } from "@/hooks/use-meeting-lifecycle";
import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    role: UserRole.Mentee,
    fullName: "Ece Demir",
  }),
}));

vi.mock("@/hooks/use-meeting-lifecycle", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/use-meeting-lifecycle")
  >("@/hooks/use-meeting-lifecycle");
  return {
    ...actual,
    useMeetingLifecycle: vi.fn(),
  };
});

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequest: () => ({
    data: {
      id: "req-1",
      requesterId: "u-1",
      requesterName: "Ece Demir",
      organizationId: "org-1",
      organizationName: "Nova Labs",
      mentorId: "mentor-1",
      mentorName: "Deniz Kaya",
      supportArea: "İş modeli ve strateji",
      summary: "Finansal modeli netleştiremiyoruz.",
      requesterMessage: "İlk varsayımları çıkarmak istiyoruz.",
      status: MentorshipRequestStatus.Accepted,
      mentorMessage: null,
      rejectionReason: null,
      createdAt: "2026-09-01T10:00:00.000Z",
      messages: [],
      recommendationSnapshot: {
        matchingMethod: "PROFILE",
        matchingModel: null,
        generatedAt: "2026-09-01T10:00:00.000Z",
        startupName: "Nova Labs",
        startupSector: null,
        startupStage: null,
        startupSummary: null,
        startupTechnologies: [],
      },
    },
    isLoading: false,
    error: null,
  }),
}));

const getMeetingRoom = vi.fn();
const getAssistantShare = vi.fn();

vi.mock("@/lib/client/meetings", () => ({
  getMeetingRoom: (...args: unknown[]) => getMeetingRoom(...args),
}));

vi.mock("@/hooks/use-meeting-notes", () => ({
  useAssistantShare: () => ({
    data: getAssistantShare(),
    isLoading: false,
    isError: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getMeetingRoom.mockResolvedValue([
    {
      id: "meeting-1",
      organizationId: "org-1",
      organizationName: "Nova Labs",
      mentorName: "Deniz Kaya",
      scheduledAt: "2026-09-01T15:00:00+03:00",
      durationMinutes: 45,
      status: MeetingStatus.Completed,
    },
  ]);
  getAssistantShare.mockReturnValue(null);
  vi.mocked(useMeetingLifecycle).mockReturnValue({
    completeMeeting: vi.fn(),
    error: null,
    isLoading: false,
    isSaving: false,
    meeting: {
      id: "meeting-1",
      organizationId: "org-1",
      organizationName: "Nova Labs",
      mentorName: "Deniz Kaya",
      mentorshipRequestId: "req-1",
      scheduledAt: "2026-09-01T15:00:00+03:00",
      durationMinutes: 45,
      agenda: "İş modeli",
      notes: "Konuşulan not",
      outcomes: "Karar alındı",
      status: MeetingStatus.Completed,
    },
    meetingHref: (path: string) => `${path}?id=meeting-1`,
    notes: "",
    outcomes: "",
    saveNotes: vi.fn(),
    setNotes: vi.fn(),
    setOutcomes: vi.fn(),
  });
});

describe("MeetingAboutPage", () => {
  it("shows invitees, request context, notes, and empty report state", async () => {
    renderWithQueryClient(<MeetingAboutPage />);

    expect(
      screen.getByText("Deniz Kaya ile Mentorluk Görüşmesi"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Deniz Kaya · Nova Labs"),
    ).toBeInTheDocument();
    expect(screen.getByText("Talep bilgileri")).toBeInTheDocument();
    expect(
      screen.getByText("Finansal modeli netleştiremiyoruz."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("İlk varsayımları çıkarmak istiyoruz."),
    ).toBeInTheDocument();
    expect(screen.getByText("Kayıtlı notlar")).toBeInTheDocument();
    expect(screen.getByText("Konuşulan not")).toBeInTheDocument();
    expect(
      screen.getByText("Bu toplantı için rapor paylaşılmamış."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Meet linki/)).not.toBeInTheDocument();
  });

  it("renders the shared meeting report when present", () => {
    getAssistantShare.mockReturnValue({
      meetingId: "meeting-1",
      transcript: null,
      transcriptPublishedAt: null,
      report: {
        title: "Finans görüşmesi",
        topic: "Pricing",
        meetingDate: "2026-09-01",
        summary: "İki senaryo test edilecek.",
        topicsDiscussed: ["Pricing"],
        decisions: ["Sabit giderler ayrılacak"],
        actionItems: [],
        risksOrBlockers: [],
        nextSteps: [],
      },
      reportPublishedAt: "2026-09-01T16:00:00.000Z",
    });

    renderWithQueryClient(<MeetingAboutPage />);

    expect(screen.getByText("Toplantı raporu")).toBeInTheDocument();
    expect(screen.getByText("İki senaryo test edilecek.")).toBeInTheDocument();
    expect(
      screen.queryByText("Bu toplantı için rapor paylaşılmamış."),
    ).not.toBeInTheDocument();
  });
});
