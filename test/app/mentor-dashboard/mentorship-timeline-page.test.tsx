import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorshipTimelinePage from "@/app/mentor-dashboard/mentorship/[id]/page";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import {
  useLogMeetingForm,
  useMeetingNoteForm,
  useMentorshipMeetings,
} from "@/hooks/use-mentorship-timeline";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "request-1" }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    session: { userId: "mentor-1", email: "m@teknokent.demo" },
  }),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequest: vi.fn(),
}));

vi.mock("@/hooks/use-mentorship-timeline", () => ({
  useMentorshipMeetings: vi.fn(),
  useLogMeetingForm: vi.fn(),
  useMeetingNoteForm: vi.fn(),
}));

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    scheduledAt: "2026-08-15T10:00:00.000Z",
    durationMinutes: 45,
    agenda: "Test gündem",
    notes: "Test not",
    status: MeetingStatus.Completed,
    ...overrides,
  };
}

const requestFixture = {
  id: "request-1",
  requesterId: "requester-1",
  organizationId: "org-1",
  organizationName: "GreenLoop",
  mentorId: "mentor-1",
  mentorName: "Leyla Aksoy",
  supportArea: "İş modeli ve strateji",
  status: MentorshipRequestStatus.Accepted,
  mentorMessage: null,
  rejectionReason: null,
  createdAt: "2026-08-17T09:49:54.374504Z",
  messages: [],
};

const emptyLogForm = {
  scheduledAt: "2026-08-22T10:00",
  durationMinutes: 60,
  agenda: "",
  notes: "",
  status: MeetingStatus.Completed,
};

describe("MentorshipTimelinePage", () => {
  const handleLogMeeting = vi.fn();
  const updateForm = vi.fn();
  const resetForm = vi.fn();
  const handleSave = vi.fn();
  const setNotes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: requestFixture,
      isLoading: false,
    } as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useMentorshipMeetings).mockReturnValue({
      data: [meeting()],
      isLoading: false,
    } as ReturnType<typeof useMentorshipMeetings>);
    vi.mocked(useLogMeetingForm).mockReturnValue({
      form: emptyLogForm,
      logError: "",
      isLogging: false,
      updateForm,
      resetForm,
      handleLogMeeting,
    } as ReturnType<typeof useLogMeetingForm>);
    handleSave.mockResolvedValue(undefined);
    vi.mocked(useMeetingNoteForm).mockReturnValue({
      notes: "Test not",
      setNotes,
      outcomes: "",
      setOutcomes: vi.fn(),
      status: MeetingStatus.Completed,
      setStatus: vi.fn(),
      handleSave,
      isSaving: false,
    } as ReturnType<typeof useMeetingNoteForm>);
  });

  it("shows a loading state while the request is loading", () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useMentorshipRequest>);

    renderWithQueryClient(<MentorshipTimelinePage />);

    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("shows a not-found state when the request is missing", () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useMentorshipRequest>);

    renderWithQueryClient(<MentorshipTimelinePage />);

    expect(screen.getByText("Talep bulunamadı.")).toBeInTheDocument();
  });

  it("renders the request header and the meeting timeline", () => {
    renderWithQueryClient(<MentorshipTimelinePage />);

    expect(screen.getByText("GreenLoop")).toBeInTheDocument();
    expect(screen.getByText("İş modeli ve strateji")).toBeInTheDocument();
    expect(screen.getByText(/Test gündem/)).toBeInTheDocument();
    expect(screen.getByText(/Test not/)).toBeInTheDocument();
  });

  it("shows an empty state when no meetings exist yet", () => {
    vi.mocked(useMentorshipMeetings).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMentorshipMeetings>);

    renderWithQueryClient(<MentorshipTimelinePage />);

    expect(
      screen.getByText("Henüz kaydedilmiş bir görüşme yok."),
    ).toBeInTheDocument();
  });

  it("calls handleLogMeeting when the log-meeting button is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorshipTimelinePage />);

    await user.click(screen.getByText("Görüşmeyi Kaydet"));

    expect(handleLogMeeting).toHaveBeenCalled();
  });

  it("updates the form when the agenda field changes", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorshipTimelinePage />);

    await user.type(screen.getByPlaceholderText("Görüşme konusu..."), "x");

    expect(updateForm).toHaveBeenCalledWith({ agenda: "x" });
  });

  it("opens the note editor, edits notes via the hook, and saves", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorshipTimelinePage />);

    await user.click(screen.getByText("Not / durum düzenle"));
    const notesFields = screen.getAllByPlaceholderText("Görüşme notları...");
    await user.type(notesFields[0], "x");

    expect(setNotes).toHaveBeenCalled();
    expect(useMeetingNoteForm).toHaveBeenCalledWith(
      "request-1",
      expect.objectContaining({ id: "meeting-1" }),
    );

    await user.click(screen.getByText("Kaydet"));

    expect(handleSave).toHaveBeenCalled();
  });

  it("closes the note editor after a successful save", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorshipTimelinePage />);

    await user.click(screen.getByText("Not / durum düzenle"));
    await user.click(screen.getByText("Kaydet"));

    await waitFor(() =>
      expect(screen.getByText("Not / durum düzenle")).toBeInTheDocument(),
    );
  });
});
