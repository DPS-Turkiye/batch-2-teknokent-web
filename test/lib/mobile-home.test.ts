import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
  type RequestMessage,
} from "@/interfaces/mentorship-request";
import type { HomeTask } from "@/lib/mentee-home";
import {
  meetingSummary,
  meetingTimeLine,
  meetingWhenChip,
  messagePreviews,
  taskPreviews,
} from "@/lib/mobile-home";
import { DueTone, HomeTaskKind } from "@/types/mentee-home";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";

const NOW = new Date(2026, 8, 23, 9, 0);

function message(body: string, createdAt: string): RequestMessage {
  return {
    id: `msg-${createdAt}`,
    authorId: "mentor-1",
    authorName: "Barış Öztürk",
    messageType: MentorshipRequestMessageType.MentorMessage,
    body,
    createdAt,
  };
}

function task(index: number): HomeTask {
  return {
    id: `action-${index}`,
    kind: HomeTaskKind.ActionItem,
    title: `Görev ${index}`,
    subtitle: "Barış Öztürk",
    dueTone: DueTone.Upcoming,
    dueLabel: "25 Eylül",
    actionLabel: "Aç",
    href: "/startup/process",
  };
}

describe("meetingWhenChip", () => {
  it("says Yarın for a meeting tomorrow", () => {
    const meeting = menteeMeetingFixture({
      scheduledAt: new Date(2026, 8, 24, 14, 0).toISOString(),
    });

    expect(meetingWhenChip(meeting, NOW)).toBe("Yarın · 14:00");
  });

  it("names the day for a meeting further out", () => {
    const meeting = menteeMeetingFixture({
      scheduledAt: new Date(2026, 8, 30, 9, 30).toISOString(),
    });

    expect(meetingWhenChip(meeting, NOW)).toBe("30 Eylül · 09:30");
  });
});

describe("meetingTimeLine", () => {
  it("shows the weekday, the time range and Online for a meeting with a link", () => {
    const meeting = menteeMeetingFixture({
      scheduledAt: new Date(2026, 8, 24, 14, 0).toISOString(),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/abc-defg-hij",
    });

    expect(meetingTimeLine(meeting)).toBe(
      "Perşembe 24 Eylül · 14:00–15:00 · Online",
    );
  });
});

describe("meetingSummary", () => {
  it("counts earlier meetings with the same mentor and skips cancelled ones", () => {
    const next = menteeMeetingFixture({
      id: "next",
      mentorId: "mentor-1",
      mentorName: "Barış Öztürk",
      agenda: "Ürün stratejisi\nDetaylar",
      scheduledAt: new Date(2026, 8, 24, 14, 0).toISOString(),
    });
    const meetings = [
      menteeMeetingFixture({ id: "a", mentorId: "mentor-1" }),
      menteeMeetingFixture({
        id: "b",
        mentorId: "mentor-1",
        status: MeetingStatus.Cancelled,
      }),
      menteeMeetingFixture({ id: "c", mentorId: "mentor-2" }),
      next,
    ];

    const summary = meetingSummary(next, meetings, NOW);

    expect(summary).toMatchObject({
      title: "Ürün stratejisi",
      mentorName: "Barış Öztürk",
      mentorInitials: "BÖ",
      mentorDetail: "2. görüşme",
      href: "/m/calendar?meeting=next",
    });
  });

  it("falls back to a generic title and mentor when the meeting has none", () => {
    const summary = meetingSummary(menteeMeetingFixture(), [], NOW);

    expect(summary.title).toBe("Mentorluk görüşmesi");
    expect(summary.mentorName).toBe("Mentörün");
    expect(summary.mentorDetail).toBe("Mentor");
  });
});

describe("taskPreviews", () => {
  it("keeps the first three tasks and sends each to the Görevler tab", () => {
    const previews = taskPreviews([task(1), task(2), task(3), task(4)]);

    expect(previews.map((preview) => preview.title)).toEqual([
      "Görev 1",
      "Görev 2",
      "Görev 3",
    ]);
    expect(previews[0]?.href).toBe("/m/tasks");
  });
});

describe("messagePreviews", () => {
  it("shows the latest message of the two most recent active conversations", () => {
    const requests = [
      menteeRequestFixture({
        id: "old",
        status: MentorshipRequestStatus.Accepted,
        mentorId: "m-ayse",
        mentorName: "Ayşe Kaya",
        messages: [message("Eski mesaj", "2026-09-20T10:00:00Z")],
      }),
      menteeRequestFixture({
        id: "recent",
        status: MentorshipRequestStatus.Accepted,
        mentorId: "m-baris",
        mentorName: "Barış Öztürk",
        messages: [
          message("İlk", "2026-09-22T08:00:00Z"),
          message("Yeni dosyayı inceledim", "2026-09-22T18:00:00Z"),
        ],
      }),
      menteeRequestFixture({
        id: "middle",
        status: MentorshipRequestStatus.Accepted,
        mentorId: "m-can",
        mentorName: "Can Demir",
        messages: [message("Merhaba", "2026-09-21T10:00:00Z")],
      }),
      menteeRequestFixture({
        id: "declined",
        status: MentorshipRequestStatus.Declined,
        messages: [message("Kapandı", "2026-09-23T08:00:00Z")],
      }),
    ];

    const previews = messagePreviews(requests, NOW);

    expect(previews.map((preview) => preview.id)).toEqual(["recent", "middle"]);
    expect(previews[0]).toMatchObject({
      name: "Barış Öztürk",
      initials: "BÖ",
      preview: "Yeni dosyayı inceledim",
      time: "Dün",
      href: "/m/messages/mentorship/recent",
    });
  });

  it("includes a pending request's thread, which can already be written in", () => {
    const requests = [
      menteeRequestFixture({
        id: "pending",
        status: MentorshipRequestStatus.Pending,
        messages: [message("hello", "2026-09-23T08:00:00Z")],
      }),
    ];

    expect(messagePreviews(requests, NOW).map((preview) => preview.id)).toEqual(
      ["pending"],
    );
  });

  it("leaves out active conversations without any message", () => {
    const requests = [
      menteeRequestFixture({ status: MentorshipRequestStatus.Accepted }),
    ];

    expect(messagePreviews(requests, NOW)).toEqual([]);
  });
});
