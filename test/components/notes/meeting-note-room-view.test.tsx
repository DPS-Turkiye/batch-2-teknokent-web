import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingNoteRoomView } from "@/components/notes/meeting-note-room-view";
import {
  RealtimeStatus,
  useMeetingRoomSocket,
} from "@/hooks/use-meeting-room-socket";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentors } from "@/hooks/use-mentors";
import {
  useOpenDocument,
  useStartupDocuments,
} from "@/hooks/use-startup-documents";
import {
  useOpenTodoCounts,
  useStartupMeetingNotes,
} from "@/hooks/use-startup-meeting-notes";
import { meetingFixture } from "@test/fixtures/startup-meetings";
import { successQuery } from "@test/mocks/query-results";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/notes/meeting-note-editor", () => ({
  MeetingNoteEditor: ({ footer }: { footer?: ReactNode }) => (
    <section>
      <p>collaborative notebook</p>
      {footer}
    </section>
  ),
}));

vi.mock("@/components/notes/meeting-note-snapshot-view", () => ({
  MeetingNoteSnapshotView: () => <p>snapshot notebook</p>,
}));

vi.mock("@/components/notes/meeting-todo-list", () => ({
  MeetingTodoList: () => <h2>Yapılacaklar</h2>,
}));

vi.mock("@/components/notes/meeting-assistant-share-panel", () => ({
  MeetingAssistantSharePanel: () => (
    <>
      <p>Toplantı Transkripti</p>
      <p>Toplantı Raporu</p>
    </>
  ),
}));

vi.mock("@/hooks/use-meeting-room-socket", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-meeting-room-socket")>()),
  useMeetingRoomSocket: vi.fn(),
}));

vi.mock("@/hooks/use-meeting-note-document", () => ({
  DocumentStatus: { Loading: "loading", Ready: "ready", Failed: "failed" },
  useMeetingNoteDocument: () => ({
    doc: {},
    status: "ready",
    seedFromSnapshot: false,
    persistFullState: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-meeting-note-presence", () => ({
  useMeetingNotePresence: () => ({}),
}));

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: vi.fn(),
}));

vi.mock("@/hooks/use-mentors", () => ({
  useMentors: vi.fn(),
}));

vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: vi.fn(),
  useStartupDocuments: vi.fn(),
}));

vi.mock("@/hooks/use-startup-meeting-notes", () => ({
  useOpenTodoCounts: vi.fn(),
  useStartupMeetingNotes: vi.fn(),
}));

const current = meetingFixture("mvp", "2026-08-18T09:00:00Z");
const sameMentor = meetingFixture("finance", "2026-08-20T09:00:00Z", {
  agenda: "Financial Model & Sustainability",
});
const otherMentor = meetingFixture("other", "2026-08-22T09:00:00Z", {
  mentorId: "mentor-2",
  mentorName: "Ayşe Kaya",
  agenda: "Başka mentör",
});

describe("MeetingNoteRoomView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMeetings).mockReturnValue({
      data: [current, sameMentor, otherMentor],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMeetings>);
    vi.mocked(useMentors).mockReturnValue({
      data: [{ id: "mentor-1", professionalTitle: "UX/UI Mentor" }],
    } as ReturnType<typeof useMentors>);
    vi.mocked(useStartupDocuments).mockReturnValue(successQuery([]));
    vi.mocked(useOpenDocument).mockReturnValue(vi.fn());
    vi.mocked(useOpenTodoCounts).mockReturnValue(new Map([["finance", 1]]));
    vi.mocked(useStartupMeetingNotes).mockReturnValue({
      addTodo: vi.fn(),
      isAddingTodo: false,
      isUploading: false,
      noteContent: "",
      noteLoading: false,
      setTodoDraft: vi.fn(),
      todoDraft: "",
      todos: [],
      toggleTodo: vi.fn(),
      uploadFile: vi.fn(),
      uploadPhoto: vi.fn(),
    });
    vi.mocked(useMeetingRoomSocket).mockReturnValue({
      status: RealtimeStatus.Connected,
      subscribeToDocumentUpdates: vi.fn(),
      publishDocumentUpdate: vi.fn(),
      subscribeToPresenceUpdates: vi.fn(),
      publishPresenceUpdate: vi.fn(),
    });
  });

  it("opens the live notebook and horizontally lists other notes with the same mentor", () => {
    renderWithQueryClient(<MeetingNoteRoomView meetingId="mvp" />);

    expect(
      screen.getByRole("heading", { name: "MVP Scope & User Flow" }),
    ).toBeInTheDocument();
    expect(screen.getByText("collaborative notebook")).toBeInTheDocument();
    expect(screen.getByText("Canlı")).toBeInTheDocument();
    expect(screen.getByText("Toplantı Transkripti")).toBeInTheDocument();
    expect(screen.getByText("Toplantı Raporu")).toBeInTheDocument();
    expect(screen.getByLabelText("Fotoğraf Yükle")).toBeInTheDocument();
    expect(screen.getByLabelText("Dosya yükle")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Yapılacaklar" }),
    ).toBeInTheDocument();

    const otherNote = screen.getByRole("link", {
      name: /Financial Model & Sustainability/,
    });
    expect(otherNote).toHaveAttribute("href", "/notes/finance");
    expect(screen.queryByText("Başka mentör")).not.toBeInTheDocument();
  });
});
