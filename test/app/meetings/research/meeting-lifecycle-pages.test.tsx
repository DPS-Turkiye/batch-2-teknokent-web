import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MeetingFeedbackPage from "@/app/meetings/research/feedback/page";
import MeetingDetailPage from "@/app/meetings/research/page";
import MeetingPreparationPage from "@/app/meetings/research/prepare/page";
import MeetingSummaryPage from "@/app/meetings/research/summary/page";
import {
  useMeetingFeedback,
  useMeetingLifecycle,
} from "@/hooks/use-meeting-lifecycle";
import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { MEETING_PREPARE_CHECKLIST } from "@/lib/const";
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
    useMeetingFeedback: vi.fn(),
  };
});

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

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

const saveNotes = vi.fn();
const completeMeeting = vi.fn();
const rate = vi.fn();
const submit = vi.fn();
const toggleBenefit = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useMeetingLifecycle).mockReturnValue({
    completeMeeting,
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
      agenda: "Financial Planning & Business Model",
      notes: "Pricing varsayımları konuşuldu.",
      outcomes: "12 aylık model hazırlanacak.",
      meetLink: "https://meet.google.com/abc-defg-hij",
      status: MeetingStatus.Scheduled,
    },
    meetingHref: (path: string) => `${path}?id=meeting-1`,
    notes: "Pricing varsayımları konuşuldu.",
    outcomes: "12 aylık model hazırlanacak.",
    saveNotes,
    setNotes: vi.fn(),
    setOutcomes: vi.fn(),
  });
  vi.mocked(useMeetingFeedback).mockReturnValue({
    canSubmit: true,
    nextMeetingNote: "",
    rate,
    ratings: [4, 4, 5, 4],
    selectedBenefits: new Set(["Finansal modeli anlamak"]),
    setNextMeetingNote: vi.fn(),
    submit,
    submitError: "",
    submitted: false,
    submitting: false,
    toggleBenefit,
  });
});

describe("meeting lifecycle pages", () => {
  it("shows request context and meet link on the call page", () => {
    renderWithQueryClient(<MeetingDetailPage />);

    expect(
      screen.getByText("Deniz Kaya ile Mentorluk Görüşmesi"),
    ).toBeInTheDocument();
    expect(screen.getByText("Talep özeti")).toBeInTheDocument();
    expect(screen.getByText("Nerede takıldık?")).toBeInTheDocument();
    expect(
      screen.getByText("Finansal modeli netleştiremiyoruz."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bu görüşmeden neyle ayrılmak istiyorsun?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("İlk varsayımları çıkarmak istiyoruz."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "https://meet.google.com/abc-defg-hij",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Görüşme özetini tamamla"),
    ).not.toBeInTheDocument();
  });

  it("shows meet link placeholder when missing", () => {
    vi.mocked(useMeetingLifecycle).mockReturnValue({
      completeMeeting,
      error: null,
      isLoading: false,
      isSaving: false,
      meeting: {
        id: "meeting-1",
        organizationId: "org-1",
        mentorName: "Deniz Kaya",
        mentorshipRequestId: "req-1",
        scheduledAt: "2026-09-01T15:00:00+03:00",
        durationMinutes: 45,
        status: MeetingStatus.Scheduled,
      },
      meetingHref: (path: string) => `${path}?id=meeting-1`,
      notes: "",
      outcomes: "",
      saveNotes,
      setNotes: vi.fn(),
      setOutcomes: vi.fn(),
    });

    renderWithQueryClient(<MeetingDetailPage />);

    expect(screen.getByText("Meet linki henüz koyulmadı")).toBeInTheDocument();
  });

  it("shows persisted notes and completes the meeting", async () => {
    const user = userEvent.setup();
    render(<MeetingSummaryPage />);

    expect(
      screen.getByText("Pricing varsayımları konuşuldu."),
    ).toBeInTheDocument();

    await user.click(screen.getByText("Görüşmeyi tamamla"));
    expect(completeMeeting).toHaveBeenCalledOnce();
  });

  it("shows an empty state instead of demo data when no meeting exists", () => {
    vi.mocked(useMeetingLifecycle).mockReturnValue({
      completeMeeting,
      error: null,
      isLoading: false,
      isSaving: false,
      meeting: null,
      meetingHref: (path: string) => path,
      notes: "",
      outcomes: "",
      saveNotes,
      setNotes: vi.fn(),
      setOutcomes: vi.fn(),
    });

    renderWithQueryClient(<MeetingDetailPage />);

    expect(
      screen.getByText("Görüntülenecek toplantı bulunamadı."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Çağrı Yılmaz/)).not.toBeInTheDocument();
  });

  it("captures a feedback rating and submits the evaluation", async () => {
    const user = userEvent.setup();
    render(<MeetingFeedbackPage />);

    expect(
      screen.getByText("Bu görüşme sana ne kadar yardımcı oldu?"),
    ).toBeInTheDocument();

    const rating = screen.getByRole("button", {
      name: /Görüşme sonunda bir sonraki adımlarım.*5/i,
    });
    await user.click(rating);
    expect(rate).toHaveBeenCalledWith(0, 5);

    await user.click(screen.getByText("Değerlendirmeyi gönder"));
    expect(submit).toHaveBeenCalledOnce();
  });

  it("will not submit an evaluation until every question is rated", async () => {
    vi.mocked(useMeetingFeedback).mockReturnValue({
      canSubmit: false,
      nextMeetingNote: "",
      rate,
      ratings: [4, 0, 0, 0],
      selectedBenefits: new Set<string>(),
      setNextMeetingNote: vi.fn(),
      submit,
      submitError: "",
      submitted: false,
      submitting: false,
      toggleBenefit,
    });
    const user = userEvent.setup();
    render(<MeetingFeedbackPage />);

    await user.click(screen.getByText("Değerlendirmeyi gönder"));
    expect(submit).not.toHaveBeenCalled();
  });

  it("shows preparation checklist for the selected meeting", () => {
    render(<MeetingPreparationPage />);
    expect(screen.getByText("Toplantının Amacı")).toBeInTheDocument();
    expect(screen.getByText(MEETING_PREPARE_CHECKLIST[0]!)).toBeInTheDocument();
  });
});
