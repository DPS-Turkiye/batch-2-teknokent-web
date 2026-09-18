import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  groupMeetingsByMentor,
  groupMeetingsByTopic,
  groupMeetingsByYear,
  MeetingTiming,
  meetingTiming,
  meetingNotebookHref,
  meetingsWithSameMentor,
  meetingTitle,
  notePreview,
  visibleMeetings,
} from "@/lib/startup-meetings";

const NOW = new Date("2026-09-11T12:00:00Z");

function meeting(
  id: string,
  scheduledAt: string,
  overrides: Partial<MeetingItem> = {},
): MeetingItem {
  return {
    id,
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorName: "Nihan Öztürk",
    scheduledAt,
    durationMinutes: 45,
    agenda: "MVP Scope & User Flow",
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

describe("meeting labels", () => {
  it("falls back to a plain title when the agenda is empty", () => {
    expect(
      meetingTitle(meeting("m", "2026-09-01T09:00:00Z", { agenda: " " })),
    ).toBe("Toplantı");
  });

  it("tells a held meeting from one still ahead", () => {
    expect(meetingTiming(meeting("past", "2026-09-01T09:00:00Z"), NOW)).toBe(
      MeetingTiming.Held,
    );
    expect(meetingTiming(meeting("next", "2026-09-18T09:00:00Z"), NOW)).toBe(
      MeetingTiming.Upcoming,
    );
  });

  it("leaves cancelled meetings out", () => {
    expect(
      visibleMeetings([
        meeting("kept", "2026-09-01T09:00:00Z"),
        meeting("gone", "2026-09-02T09:00:00Z", {
          status: MeetingStatus.Cancelled,
        }),
      ]).map((item) => item.id),
    ).toEqual(["kept"]);
  });
});

describe("groupMeetingsByTopic", () => {
  it("stacks a mentorship's meetings and puts the one with a meeting ahead first", () => {
    const topics = groupMeetingsByTopic(
      [
        meeting("finance-1", "2026-08-10T09:00:00Z", {
          mentorshipRequestId: "req-finance",
          agenda: "Financial Model & Sustainability",
        }),
        meeting("mvp-1", "2026-08-18T09:00:00Z", {
          mentorshipRequestId: "req-mvp",
        }),
        meeting("mvp-2", "2026-09-18T09:00:00Z", {
          mentorshipRequestId: "req-mvp",
        }),
        meeting("finance-2", "2026-08-20T09:00:00Z", {
          mentorshipRequestId: "req-finance",
          agenda: "Financial Model & Sustainability",
        }),
      ],
      NOW,
    );

    expect(topics.map((topic) => topic.key)).toEqual([
      "req-mvp",
      "req-finance",
    ]);
    expect(topics[0].upcoming?.id).toBe("mvp-2");
    expect(topics[0].meetings.map((item) => item.id)).toEqual([
      "mvp-2",
      "mvp-1",
    ]);
    expect(topics[1].upcoming).toBeNull();
    expect(topics[1].latest.id).toBe("finance-2");
  });

  it("groups meetings outside a mentorship by their agenda", () => {
    const topics = groupMeetingsByTopic(
      [
        meeting("a", "2026-08-01T09:00:00Z", { agenda: "Pitch Prova" }),
        meeting("b", "2026-08-08T09:00:00Z", { agenda: "pitch prova" }),
      ],
      NOW,
    );

    expect(topics).toHaveLength(1);
    expect(topics[0].meetings).toHaveLength(2);
  });
});

describe("groupMeetingsByYear", () => {
  it("orders years and months newest first and each month soonest first", () => {
    const years = groupMeetingsByYear([
      meeting("sep-late", "2026-09-20T09:00:00Z"),
      meeting("aug", "2026-08-18T09:00:00Z"),
      meeting("sep-early", "2026-09-02T09:00:00Z"),
      meeting("last-year", "2025-11-05T09:00:00Z"),
    ]);

    expect(years.map((year) => year.year)).toEqual([2026, 2025]);
    expect(years[0].months.map((month) => month.label)).toEqual([
      "Eylül",
      "Ağustos",
    ]);
    expect(years[0].months[0].meetings.map((item) => item.id)).toEqual([
      "sep-early",
      "sep-late",
    ]);
    expect(years[1].months[0].label).toBe("Kasım");
  });
});

describe("groupMeetingsByMentor", () => {
  it("stacks one mentor's meetings and puts the one with a meeting ahead first", () => {
    const stacks = groupMeetingsByMentor(
      [
        meeting("held", "2026-08-18T09:00:00Z"),
        meeting("next", "2026-09-18T09:00:00Z"),
        meeting("other", "2026-07-10T09:00:00Z", {
          mentorId: "mentor-2",
          mentorName: "Ahmet Yılmaz",
        }),
      ],
      NOW,
    );

    expect(stacks.map((stack) => stack.title)).toEqual([
      "Nihan Öztürk",
      "Ahmet Yılmaz",
    ]);
    expect(stacks[0].meetings.map((item) => item.id)).toEqual(["next", "held"]);
    expect(stacks[1].upcoming).toBeNull();
  });
});

describe("meetingsWithSameMentor", () => {
  it("lists this startup's other notes with the same mentor, newest first", () => {
    const current = meeting("mvp", "2026-08-18T09:00:00Z");
    const others = meetingsWithSameMentor(
      [
        current,
        meeting("older", "2026-07-01T09:00:00Z"),
        meeting("newer", "2026-09-01T09:00:00Z"),
        meeting("other-mentor", "2026-09-02T09:00:00Z", {
          mentorId: "mentor-2",
          mentorName: "Ayşe",
        }),
      ],
      current,
    );

    expect(others.map((item) => item.id)).toEqual(["newer", "older"]);
  });

  it("returns nothing when the meeting has no mentor", () => {
    const current = meeting("solo", "2026-08-18T09:00:00Z", {
      mentorId: undefined,
    });
    expect(
      meetingsWithSameMentor(
        [current, meeting("kept", "2026-09-01T09:00:00Z")],
        current,
      ),
    ).toEqual([]);
  });
});

describe("notes", () => {
  it("previews a note as plain text", () => {
    expect(
      notePreview("<h2>MVP</h2><p>Kapsamı  <strong>daralt</strong>.</p>"),
    ).toBe("MVP Kapsamı daralt.");
    expect(notePreview("   ")).toBe("");
  });

  it("links a meeting to its shared notebook", () => {
    expect(meetingNotebookHref("meeting 1")).toBe("/notes/meeting%201");
  });
});
