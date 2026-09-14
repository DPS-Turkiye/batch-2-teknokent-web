import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentors } from "@/hooks/use-mentors";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useStartupDocuments } from "@/hooks/use-startup-documents";
import { useStartupMeetings } from "@/hooks/use-startup-meetings";
import type { MentorProfile } from "@/interfaces/mentor";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { StartupMeetingView } from "@/lib/startup-meetings";
import {
  meetingFileFixture,
  meetingFixture,
} from "@test/fixtures/startup-meetings";

vi.mock("@/hooks/use-meetings", () => ({ useMeetings: vi.fn() }));
vi.mock("@/hooks/use-mentors", () => ({ useMentors: vi.fn() }));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));
vi.mock("@/hooks/use-startup-documents", () => ({
  useStartupDocuments: vi.fn(),
}));

const meetings = [
  meetingFixture("mvp-held", "2026-08-18T09:00:00Z"),
  meetingFixture("mvp-next", "2026-09-18T09:00:00Z"),
  meetingFixture("finance", "2026-07-10T09:00:00Z", {
    agenda: "Financial Model & Sustainability",
    mentorId: "mentor-2",
    mentorName: "Ahmet Yılmaz",
    mentorshipRequestId: "req-finance",
  }),
];

function query<T>(data: T) {
  return { data, isLoading: false, error: null } as never;
}

describe("useStartupMeetings", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-11T12:00:00Z"));
    vi.mocked(useMeetings).mockReturnValue(query(meetings));
    vi.mocked(useMentors).mockReturnValue(
      query([
        { id: "mentor-1", professionalTitle: "UX/UI Mentor" } as MentorProfile,
      ]),
    );
    vi.mocked(useMentorshipRequests).mockReturnValue(
      query([
        {
          id: "req-mvp",
          summary: "MVP kapsamını daraltmak",
          supportArea: "Ürün",
        } as MentorshipRequest,
      ]),
    );
    vi.mocked(useStartupDocuments).mockReturnValue(
      query([meetingFileFixture("user-flow", "mvp-held")]),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stacks each mentorship's meetings, the one with a meeting ahead first", () => {
    const { result } = renderHook(() => useStartupMeetings());

    expect(result.current.view).toBe(StartupMeetingView.Topic);
    expect(result.current.topics.map((topic) => topic.key)).toEqual([
      "req-mvp",
      "req-finance",
    ]);
    expect(result.current.topics[0].upcoming?.id).toBe("mvp-next");
  });

  it("gathers each meeting's mentor title, summary and files", () => {
    const { result } = renderHook(() => useStartupMeetings());

    expect(result.current.details(meetings[0])).toEqual({
      mentorTitle: "UX/UI Mentor",
      summary: "MVP kapsamını daraltmak",
      files: [meetingFileFixture("user-flow", "mvp-held")],
    });
    expect(result.current.details(meetings[2]).mentorTitle).toBeNull();
  });

  it("narrows every view to one mentor", () => {
    const { result } = renderHook(() => useStartupMeetings());

    expect(result.current.mentorOptions.map((mentor) => mentor.name)).toEqual([
      "Ahmet Yılmaz",
      "Nihan Öztürk",
    ]);
    act(() => result.current.setMentorId("mentor-2"));

    expect(result.current.meetingCount).toBe(1);
    expect(result.current.topics.map((topic) => topic.key)).toEqual([
      "req-finance",
    ]);
  });

  it("opens the notes on the last meeting held, or on the one asked for", () => {
    const { result } = renderHook(() => useStartupMeetings());

    expect(result.current.selectedMeeting?.id).toBe("mvp-held");
    act(() => result.current.openMeetingNotes("finance"));

    expect(result.current.view).toBe(StartupMeetingView.Notes);
    expect(result.current.selectedMeeting?.id).toBe("finance");
    expect(result.current.otherMeetings.map((item) => item.id)).toEqual([
      "mvp-next",
    ]);
  });

  it("opens the timeline on the next meeting's month and lets it fold", () => {
    const { result } = renderHook(() => useStartupMeetings());

    expect(result.current.expandedYear).toBe(2026);
    expect(result.current.expandedMonthKey).toBe("2026-09");
    act(() => result.current.toggleMonth("2026-09"));
    expect(result.current.expandedMonthKey).toBeNull();
    act(() => result.current.toggleMonth("2026-07"));
    expect(result.current.expandedMonthKey).toBe("2026-07");
    act(() => result.current.toggleYear(2026));
    expect(result.current.expandedYear).toBeNull();
  });
});
