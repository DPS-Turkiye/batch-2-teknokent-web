import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentors } from "@/hooks/use-mentors";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useStartupDocuments } from "@/hooks/use-startup-documents";
import { useStartupMeetings } from "@/hooks/use-startup-meetings";
import { StartupMeetingView } from "@/lib/startup-meetings";
import { itemAt } from "@test/fixtures/list-assertions";
import { mentorProfile } from "@test/fixtures/mentors";
import { mentorshipRequest } from "@test/fixtures/mentorship-requests";
import {
  meetingFileFixture,
  meetingFixture,
} from "@test/fixtures/startup-meetings";
import { successQuery } from "@test/mocks/query-results";

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

describe("useStartupMeetings", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-11T12:00:00Z"));
    vi.mocked(useMeetings).mockReturnValue(successQuery(meetings));
    vi.mocked(useMentors).mockReturnValue(
      successQuery([
        { ...mentorProfile, id: "mentor-1", professionalTitle: "UX/UI Mentor" },
      ]),
    );
    vi.mocked(useMentorshipRequests).mockReturnValue(
      successQuery([
        mentorshipRequest({
          id: "req-mvp",
          summary: "MVP kapsamını daraltmak",
          supportArea: "Ürün",
        }),
      ]),
    );
    vi.mocked(useStartupDocuments).mockReturnValue(
      successQuery([meetingFileFixture("user-flow", "mvp-held")]),
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
    expect(result.current.topics[0]?.upcoming?.id).toBe("mvp-next");
  });

  it("gathers each meeting's mentor title, summary and files", () => {
    const { result } = renderHook(() => useStartupMeetings());

    expect(result.current.details(itemAt(meetings, 0))).toEqual({
      mentorTitle: "UX/UI Mentor",
      summary: "MVP kapsamını daraltmak",
      files: [meetingFileFixture("user-flow", "mvp-held")],
    });
    expect(result.current.details(itemAt(meetings, 2)).mentorTitle).toBeNull();
  });

  it("groups meetings by mentor, the one with a meeting ahead first", () => {
    const { result } = renderHook(() => useStartupMeetings());

    expect(result.current.mentors.map((stack) => stack.title)).toEqual([
      "Nihan Öztürk",
      "Ahmet Yılmaz",
    ]);
    expect(result.current.mentors[0]?.meetings.map((item) => item.id)).toEqual([
      "mvp-next",
      "mvp-held",
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

  it("opens and closes the topic stack for a mentorship", () => {
    const { result } = renderHook(() => useStartupMeetings());

    act(() => result.current.openTopicStack("req-finance"));
    expect(result.current.selectedTopic?.key).toBe("req-finance");
    expect(result.current.selectedTopic?.meetings.map((m) => m.id)).toEqual([
      "finance",
    ]);

    act(() => result.current.closeTopicStack());
    expect(result.current.selectedTopic).toBeNull();
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
