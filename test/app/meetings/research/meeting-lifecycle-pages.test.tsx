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

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
      mentorName: "Deniz Kaya",
      scheduledAt: "2026-09-01T15:00:00+03:00",
      durationMinutes: 45,
      agenda: "Financial Planning & Business Model",
      notes: "Pricing varsayımları konuşuldu.",
      outcomes: "12 aylık model hazırlanacak.",
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
  it("saves live meeting notes before moving to the summary", async () => {
    const user = userEvent.setup();
    render(<MeetingDetailPage />);

    expect(
      screen.getByText("Deniz Kaya ile Mentorluk Görüşmesi"),
    ).toBeInTheDocument();
    await user.click(screen.getByText("Görüşme özetini tamamla"));
    expect(saveNotes).toHaveBeenCalledOnce();
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

    render(<MeetingDetailPage />);

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

  // Reported: the prepare page always said "10 saatten az kaldı" no matter how
  // far off the meeting actually was.
  it("computes the countdown from the meeting's scheduled time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T13:00:00+03:00"));

    render(<MeetingPreparationPage />);

    expect(
      screen.getByText("△ Toplantıya 2 saatten az kaldı"),
    ).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("shows a failed submission instead of a success state", () => {
    vi.mocked(useMeetingFeedback).mockReturnValue({
      canSubmit: true,
      rate,
      ratings: [4, 4, 5],
      selectedBenefits: new Set<string>(),
      submit,
      submitError: "Değerlendirme kaydedilemedi. Lütfen tekrar deneyin.",
      submitted: false,
      submitting: false,
      toggleBenefit,
    });
    render(<MeetingFeedbackPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Değerlendirme kaydedilemedi",
    );
  });
});
