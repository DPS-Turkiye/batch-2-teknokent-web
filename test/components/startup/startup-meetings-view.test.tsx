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
  groupMeetingsByMentor,
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/startup/meeting-notes-panel", () => ({
  MeetingNotesPanel: () => <p>notes panel</p>,
}));

const meeting = meetingFixture("next", "2026-09-18T09:00:00Z");

type Meetings = ReturnType<typeof useStartupMeetings>;

function state(overrides: Partial<Meetings> = {}): Meetings {
  return {
    closeTopicStack: vi.fn(),
    details: detailsFixture(),
    error: null,
    expandedMonthKey: "2026-09",
    expandedYear: 2026,
    isLoading: false,
    layout: MeetingLayout.Grid,
    meetingCount: 1,
    mentors: groupMeetingsByMentor([meeting], new Date("2026-09-11T12:00:00Z")),
    openMeetingNotes: vi.fn(),
    openTopicStack: vi.fn(),
    otherMeetings: [],
    selectedMeeting: meeting,
    selectedTopic: null,
    setLayout: vi.fn(),
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

  it("switches views and layout from the toolbar", async () => {
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
    await user.click(screen.getByRole("button", { name: "Mentor" }));

    expect(meetings.setView).toHaveBeenCalledWith(StartupMeetingView.Time);
    expect(meetings.setLayout).toHaveBeenCalledWith(MeetingLayout.List);
    expect(meetings.setView).toHaveBeenCalledWith(StartupMeetingView.Mentor);
    expect(
      screen.queryByLabelText("Mentora göre filtrele"),
    ).not.toBeInTheDocument();
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

  it("opens a topic stack from the Konu grid", async () => {
    const user = userEvent.setup();
    const meetings = state();
    vi.mocked(useStartupMeetings).mockReturnValue(meetings);
    renderWithQueryClient(<StartupMeetingsView />);

    await user.click(
      screen.getByRole("button", {
        name: "MVP Scope & User Flow notlarını aç",
      }),
    );

    expect(meetings.openTopicStack).toHaveBeenCalledWith("req-mvp");
  });

  it("shows the topic stack dialog when a topic is selected", () => {
    const topics = groupMeetingsByTopic(
      [meeting],
      new Date("2026-09-11T12:00:00Z"),
    );
    vi.mocked(useStartupMeetings).mockReturnValue(
      state({ selectedTopic: topics[0] }),
    );

    renderWithQueryClient(<StartupMeetingsView />);

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "MVP Scope & User Flow",
    );
  });

  it("hides the Toplantı Notları chip on the notes hub", () => {
    vi.mocked(useStartupMeetings).mockReturnValue(state());
    renderWithQueryClient(<StartupMeetingsView hideNotesChip />);

    expect(
      screen.queryByRole("button", { name: "Toplantı Notları" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Konu" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Mentor" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("stacks the same mentor's notes in the Mentor view", () => {
    const nihan = meetingFixture("nihan-older", "2026-08-01T09:00:00Z");
    const nihanNext = meetingFixture("nihan-next", "2026-09-18T09:00:00Z");
    const ahmet = meetingFixture("ahmet", "2026-07-10T09:00:00Z", {
      mentorId: "mentor-2",
      mentorName: "Ahmet Yılmaz",
      mentorshipRequestId: "req-finance",
      agenda: "Financial Model & Sustainability",
    });
    vi.mocked(useStartupMeetings).mockReturnValue(
      state({
        meetingCount: 3,
        mentors: groupMeetingsByMentor(
          [nihan, nihanNext, ahmet],
          new Date("2026-09-11T12:00:00Z"),
        ),
        view: StartupMeetingView.Mentor,
      }),
    );

    renderWithQueryClient(<StartupMeetingsView hideNotesChip />);

    expect(screen.getByRole("button", { name: "Mentor" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Nihan Öztürk notlarını aç" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ahmet Yılmaz notlarını aç" }),
    ).toBeInTheDocument();
  });
});
