import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorshipTimelinePage from "@/app/mentor-dashboard/mentorship/[id]/page";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import {
  useLogMeeting,
  useMentorshipMeetings,
  useUpdateMeeting,
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
  useLogMeeting: vi.fn(),
  useUpdateMeeting: vi.fn(),
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

describe("MentorshipTimelinePage", () => {
  const mutateAsync = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue(meeting());
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: requestFixture,
      isLoading: false,
    } as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useMentorshipMeetings).mockReturnValue({
      data: [meeting()],
      isLoading: false,
    } as ReturnType<typeof useMentorshipMeetings>);
    vi.mocked(useLogMeeting).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useLogMeeting>);
    vi.mocked(useUpdateMeeting).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMeeting>);
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

  it("logs a new meeting with the real session mentor id", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorshipTimelinePage />);

    await user.type(
      screen.getByPlaceholderText("Görüşme konusu..."),
      "Yeni gündem",
    );
    await user.click(screen.getByText("Görüşmeyi Kaydet"));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          mentorId: "mentor-1",
          agenda: "Yeni gündem",
        }),
      );
    });
  });

  it("opens the note editor and saves an update for a meeting", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorshipTimelinePage />);

    await user.click(screen.getByText("Not / durum düzenle"));
    const notesFields = screen.getAllByPlaceholderText("Görüşme notları...");
    await user.clear(notesFields[0]);
    await user.type(notesFields[0], "Düzenlenmiş not");
    await user.click(screen.getByText("Kaydet"));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "meeting-1",
        payload: expect.objectContaining({ notes: "Düzenlenmiş not" }),
      }),
      expect.anything(),
    );
  });
});
