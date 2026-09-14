import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupMeetingsView } from "@/components/startup/startup-meetings-view";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import {
  MeetingLayout,
  useStartupMeetings,
} from "@/hooks/use-startup-meetings";
import {
  groupMeetingsByTopic,
  StartupMeetingView,
} from "@/lib/startup-meetings";
import {
  detailsFixture,
  meetingFixture,
} from "@test/fixtures/startup-meetings";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-meetings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-startup-meetings")>()),
  useStartupMeetings: vi.fn(),
}));

vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: vi.fn(),
}));

vi.mock("@/components/startup/meeting-notes-panel", () => ({
  MeetingNotesPanel: () => <p>notes panel</p>,
}));

const meeting = meetingFixture("next", "2026-09-18T09:00:00Z");

type Meetings = ReturnType<typeof useStartupMeetings>;

function state(overrides: Partial<Meetings> = {}): Meetings {
  return {
    details: detailsFixture(),
    error: null,
    expandedMonthKey: "2026-09",
    expandedYear: 2026,
    isLoading: false,
    layout: MeetingLayout.Grid,
    meetingCount: 1,
    mentorId: "",
    mentorOptions: [{ id: "mentor-1", name: "Nihan Öztürk" }],
    openMeetingNotes: vi.fn(),
    otherMeetings: [],
    selectedMeeting: meeting,
    setLayout: vi.fn(),
    setMentorId: vi.fn(),
    setView: vi.fn(),
    toggleMonth: vi.fn(),
    toggleYear: vi.fn(),
    topics: groupMeetingsByTopic([meeting], new Date("2026-09-11T12:00:00Z")),
    view: StartupMeetingView.Topic,
    years: [],
    ...overrides,
  };
}

describe("StartupMeetingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOpenDocument).mockReturnValue(vi.fn());
  });

  it("switches views, layout and mentor from the toolbar", async () => {
    const user = userEvent.setup();
    const meetings = state();
    vi.mocked(useStartupMeetings).mockReturnValue(meetings);
    renderWithQueryClient(<StartupMeetingsView />);

    expect(screen.getByRole("button", { name: "Konu" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", {
        name: "MVP Scope & User Flow notlarını aç",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zaman" }));
    await user.click(screen.getByRole("button", { name: "Liste görünümü" }));
    await user.selectOptions(
      screen.getByLabelText("Mentora göre filtrele"),
      "mentor-1",
    );

    expect(meetings.setView).toHaveBeenCalledWith(StartupMeetingView.Time);
    expect(meetings.setLayout).toHaveBeenCalledWith(MeetingLayout.List);
    expect(meetings.setMentorId).toHaveBeenCalledWith("mentor-1");
  });

  it("shows the notes panel in the notes view", () => {
    vi.mocked(useStartupMeetings).mockReturnValue(
      state({ view: StartupMeetingView.Notes }),
    );

    renderWithQueryClient(<StartupMeetingsView />);

    expect(screen.getByText("notes panel")).toBeInTheDocument();
  });

  it("points to the calendar when there are no meetings", () => {
    vi.mocked(useStartupMeetings).mockReturnValue(
      state({ meetingCount: 0, topics: [] }),
    );

    renderWithQueryClient(<StartupMeetingsView />);

    expect(
      screen.getByRole("link", { name: "Takvimden toplantı planla" }),
    ).toHaveAttribute("href", "/calendar");
  });

  it("reports meetings that could not be loaded", () => {
    vi.mocked(useStartupMeetings).mockReturnValue(
      state({ error: new Error("Toplantı hizmetine ulaşılamıyor.") }),
    );

    renderWithQueryClient(<StartupMeetingsView />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Toplantı hizmetine ulaşılamıyor.",
    );
  });
});
