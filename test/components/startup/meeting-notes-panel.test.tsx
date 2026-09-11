import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingNotesPanel } from "@/components/startup/meeting-notes-panel";
import {
  useOpenTodoCounts,
  useStartupMeetingNotes,
} from "@/hooks/use-startup-meeting-notes";
import {
  detailsFixture,
  meetingFixture,
} from "@test/fixtures/startup-meetings";

vi.mock("@/hooks/use-startup-meeting-notes", () => ({
  useOpenTodoCounts: vi.fn(),
  useStartupMeetingNotes: vi.fn(),
}));

const notes = {
  addTodo: vi.fn(),
  isAddingTodo: false,
  isUploading: false,
  noteContent: "<p>Kullanıcı akışını <strong>netleştir</strong>.</p>",
  noteLoading: false,
  setTodoDraft: vi.fn(),
  todoDraft: "",
  todos: [
    {
      id: "t-1",
      meetingId: "held",
      title: "Önceliklerini tanımla",
      done: false,
      displayOrder: 0,
    },
    {
      id: "t-2",
      meetingId: "held",
      title: "Koordinatör flowunu tamamla",
      done: true,
      displayOrder: 1,
    },
  ],
  toggleTodo: vi.fn(),
  uploadFile: vi.fn(),
  uploadPhoto: vi.fn(),
};

const meeting = meetingFixture("held", "2026-08-18T09:00:00Z");
const other = meetingFixture("finance", "2026-08-20T09:00:00Z", {
  agenda: "Financial Model & Sustainability",
});

function renderPanel() {
  const props = {
    details: detailsFixture(),
    meeting,
    onOpenFile: vi.fn(),
    onSelectMeeting: vi.fn(),
    otherMeetings: [other],
  };
  render(<MeetingNotesPanel {...props} />);
  return props;
}

describe("MeetingNotesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStartupMeetingNotes).mockReturnValue(notes);
    vi.mocked(useOpenTodoCounts).mockReturnValue(new Map([["finance", 2]]));
  });

  it("previews the note and links to the shared notebook", () => {
    renderPanel();

    const panel = screen.getByRole("region", {
      name: "MVP Scope & User Flow notları",
    });
    expect(
      within(panel).getByText(/Kullanıcı akışını netleştir\./),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "…Not ekle" }),
    ).toHaveAttribute("href", "/notes/held");
    expect(
      within(panel).getByRole("link", { name: /Toplantı Transkripti/ }),
    ).toHaveAttribute("href", "/notes/held");
  });

  it("uploads photos and files to the meeting", async () => {
    const user = userEvent.setup();
    const photo = new File(["png"], "board.png", { type: "image/png" });
    const deck = new File(["%PDF"], "deck.pdf", { type: "application/pdf" });
    renderPanel();

    await user.upload(screen.getByLabelText("Fotoğraf Yükle"), photo);
    await user.upload(screen.getByLabelText("Dosya yükle"), deck);

    expect(notes.uploadPhoto).toHaveBeenCalledWith(photo);
    expect(notes.uploadFile).toHaveBeenCalledWith(deck);
  });

  it("ticks off and adds to-dos", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(
      screen.getByRole("checkbox", { name: "Önceliklerini tanımla" }),
    );
    await user.type(screen.getByLabelText("Görev ekle"), "{Enter}");

    expect(notes.toggleTodo).toHaveBeenCalledWith("t-1", true);
    expect(notes.addTodo).toHaveBeenCalled();
    expect(screen.getByText("Koordinatör flowunu tamamla")).toHaveClass(
      "line-through",
    );
  });

  it("offers the other meetings and flags their open tasks", async () => {
    const user = userEvent.setup();
    const props = renderPanel();

    const card = screen.getByRole("button", {
      name: /Financial Model & Sustainability/,
    });
    expect(card).toHaveTextContent("Görevler tamamlanmadı");
    await user.click(card);

    expect(props.onSelectMeeting).toHaveBeenCalledWith("finance");
  });
});
