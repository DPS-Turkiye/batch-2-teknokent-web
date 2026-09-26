import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";
import {
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
  ProgramStatus,
  type Program,
} from "@/interfaces/program";
import {
  mentorMeetingSummary,
  mentorMessagePreviews,
  mentorStartupRows,
} from "@/lib/mobile-mentor-home";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";

const NOW = new Date(2026, 8, 23, 12, 0);
const MENTOR_ID = "mentor-1";

const ATLAS = menteeRequestFixture({
  id: "r-atlas",
  organizationId: "atlas",
  organizationName: "Atlas AI",
  status: MentorshipRequestStatus.Accepted,
  supportArea: "Positioning",
  messages: [
    {
      id: "m1",
      authorId: "founder",
      authorName: "Gamze Kozak",
      messageType: MentorshipRequestMessageType.MenteeMessage,
      body: "Toplantıyı perşembeye alabilir miyiz?",
      createdAt: "2026-09-23T08:00:00Z",
    },
  ],
});
const LUMEN = menteeRequestFixture({
  id: "r-lumen",
  organizationId: "lumen",
  organizationName: "Lumen",
  status: MentorshipRequestStatus.Accepted,
});

const MEETINGS = [
  menteeMeetingFixture({
    id: "past",
    organizationId: "atlas",
    scheduledAt: new Date(2026, 8, 1, 10, 0).toISOString(),
    status: MeetingStatus.Completed,
  }),
  menteeMeetingFixture({
    id: "next",
    organizationId: "atlas",
    organizationName: "Atlas AI",
    mentorshipRequestId: "r-atlas",
    scheduledAt: new Date(2026, 8, 23, 16, 30).toISOString(),
    durationMinutes: 45,
    meetLink: "https://meet.google.com/abc",
  }),
];

function program(name: string, mentorStatus: ProgramMentorStatus): Program {
  return {
    id: name,
    name,
    coordinatorId: "c1",
    coordinatorName: "Burcu Şen",
    createdAt: "2026-01-01T00:00:00Z",
    status: ProgramStatus.Active,
    startups: [{ id: "atlas", name: "Atlas AI" }],
    mentors: [
      {
        mentorId: MENTOR_ID,
        fullName: "Nihan Öztürk",
        email: "n@x.co",
        status: mentorStatus,
        invitedBy: ProgramMentorInvitedBy.Coordinator,
        createdAt: "2026-01-01T00:00:00Z",
      },
    ],
  };
}

describe("mentorMeetingSummary", () => {
  it("names the startup, the topic and the meeting count, and the Meet link", () => {
    const summary = mentorMeetingSummary(MEETINGS[1]!, MEETINGS, [ATLAS], NOW);

    expect(summary).toMatchObject({
      startupName: "Atlas AI",
      startupInitials: "AA",
      detail: "Positioning · 2. görüşme",
      timeLine: "Bugün · 16:30–17:15 · Google Meet",
      href: "/m/calendar?meeting=next",
    });
  });
});

describe("mentorStartupRows", () => {
  it("lists each startup once, planned ones first, with the mentor's program", () => {
    const rows = mentorStartupRows(
      [LUMEN, ATLAS, { ...ATLAS, id: "r-atlas-2" }],
      MEETINGS,
      [
        program("Başka program", ProgramMentorStatus.Pending),
        program("METU Stars 2026", ProgramMentorStatus.Accepted),
      ],
      MENTOR_ID,
      NOW,
    );

    expect(rows.map((row) => [row.name, row.program, row.next])).toEqual([
      ["Atlas AI", "METU Stars 2026", "Sonraki: Bugün 16:30"],
      ["Lumen", null, "Sonraki görüşme planlanmadı"],
    ]);
    expect(rows[1]?.planned).toBe(false);
  });
});

describe("mentorMessagePreviews", () => {
  it("shows startup conversations with messages and their unread counts", () => {
    const previews = mentorMessagePreviews([ATLAS, LUMEN], NOW);

    expect(previews).toHaveLength(1);
    expect(previews[0]).toMatchObject({
      message: {
        name: "Atlas AI",
        preview: "Toplantıyı perşembeye alabilir miyiz?",
        href: "/m/messages/mentorship/r-atlas",
      },
      unreadCount: 1,
    });
  });
});
