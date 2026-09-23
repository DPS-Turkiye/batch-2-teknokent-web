import { describe, expect, it } from "vitest";

import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  activeMentorshipFooter,
  buildHomeTasks,
  dueState,
  meetingDayLabel,
  meetingWhenLabel,
  requestStatusHref,
  sentRequestState,
} from "@/lib/mentee-home";
import { DueTone, HomeTaskKind, SentRequestState } from "@/types/mentee-home";
import {
  menteeActionItemFixture as actionItem,
  menteeMeetingFixture as meeting,
  menteeRequestFixture as request,
} from "@test/fixtures/mentee-home";

const now = new Date(2026, 8, 14, 10, 0);

describe("dueState", () => {
  it("marks past days overdue and today's date as today", () => {
    expect(dueState("2026-09-13", now)).toEqual({
      tone: DueTone.Overdue,
      label: "Gecikti",
    });
    expect(dueState("2026-09-14", now)).toEqual({
      tone: DueTone.Today,
      label: "Bugün",
    });
  });

  it("shows the day and month for later dates", () => {
    expect(dueState("2026-09-18", now)).toEqual({
      tone: DueTone.Upcoming,
      label: "18 Eylül",
    });
  });

  it("treats a missing or unreadable date as undated", () => {
    expect(dueState(null, now).tone).toBe(DueTone.None);
    expect(dueState("not-a-date", now).tone).toBe(DueTone.None);
  });

  it("reads a full timestamp in the viewer's own day", () => {
    expect(dueState(new Date(2026, 8, 14, 23, 30).toISOString(), now)).toEqual({
      tone: DueTone.Today,
      label: "Bugün",
    });
    expect(
      dueState(new Date(2026, 8, 15, 0, 30).toISOString(), now).label,
    ).toBe("15 Eylül");
  });
});

describe("meetingWhenLabel", () => {
  it("names tomorrow and marks a linked meeting as online", () => {
    expect(
      meetingWhenLabel(
        meeting({ meetLink: "https://meet.google.com/abc-defg-hij" }),
        now,
      ),
    ).toBe("Yarın · 14:00 · 45 dk · Online");
  });

  it("names today and leaves out Online without a link", () => {
    expect(
      meetingWhenLabel(
        meeting({
          scheduledAt: new Date(2026, 8, 14, 16, 30).toISOString(),
          durationMinutes: 30,
        }),
        now,
      ),
    ).toBe("Bugün · 16:30 · 30 dk");
  });

  it("uses the date for meetings further ahead", () => {
    expect(
      meetingWhenLabel(
        meeting({
          scheduledAt: new Date(2026, 8, 20, 9, 30).toISOString(),
          durationMinutes: 60,
        }),
        now,
      ),
    ).toBe("20 Eylül · 09:30 · 60 dk");
  });
});

describe("meetingDayLabel", () => {
  it("includes the year", () => {
    expect(
      meetingDayLabel(
        meeting({ scheduledAt: new Date(2026, 7, 18, 10).toISOString() }),
      ),
    ).toBe("18 Ağustos 2026");
  });
});

describe("requestStatusHref", () => {
  it("encodes the request id", () => {
    expect(requestStatusHref("a b")).toBe("/mentor-request/status?id=a%20b");
  });
});

describe("sentRequestState", () => {
  it("waits on the mentor while a request is pending", () => {
    expect(sentRequestState(request(), [])).toBe(
      SentRequestState.MentorReviewing,
    );
  });

  it("needs the mentee after a question, a counter-proposal or an unbooked acceptance", () => {
    for (const status of [
      MentorshipRequestStatus.MoreInfoRequested,
      MentorshipRequestStatus.CounterProposed,
      MentorshipRequestStatus.Accepted,
    ]) {
      expect(sentRequestState(request({ status }), [])).toBe(
        SentRequestState.ActionNeeded,
      );
    }
  });

  it("stops needing the mentee once an accepted request has a meeting", () => {
    expect(
      sentRequestState(request({ status: MentorshipRequestStatus.Accepted }), [
        meeting({ mentorshipRequestId: "r1" }),
      ]),
    ).toBe(SentRequestState.MentorReviewing);
  });
});

describe("buildHomeTasks", () => {
  it("puts overdue work first, then replies, then later work", () => {
    const tasks = buildHomeTasks({
      requests: [
        request({ status: MentorshipRequestStatus.MoreInfoRequested }),
        request({ id: "r2", mentorName: "Deniz Aksoy" }),
        request({
          id: "r3",
          status: MentorshipRequestStatus.Accepted,
          mentorName: "Selin Kaya",
          supportArea: "Finans Mentorluğu",
        }),
      ],
      meetings: [meeting({ mentorshipRequestId: "r3" })],
      actionItems: [
        actionItem({ id: "a1", dueDate: "2026-09-18" }),
        actionItem({
          id: "a2",
          title: "Pitch deck'i güncelle",
          dueDate: "2026-09-10",
        }),
      ],
      actionItemRequestIds: { a1: "r3", a2: "r3" },
      now,
    });

    expect(tasks.map((task) => task.id)).toEqual([
      "action-a2",
      "request-r1",
      "action-a1",
    ]);
    expect(tasks[0]).toMatchObject({
      kind: HomeTaskKind.ActionItem,
      dueTone: DueTone.Overdue,
      dueLabel: "Gecikti",
      subtitle: "Selin Kaya · Finans Mentorluğu",
      actionLabel: "Görevi aç",
      href: "/mentor-request/status?id=r3",
    });
    expect(tasks[1]).toMatchObject({
      kind: HomeTaskKind.RequestReply,
      title: "Mentor talebini yanıtla",
      subtitle: "Barış Öztürk · Teknik ekip kurulumu",
      dueLabel: "Bilgi bekliyor",
      actionLabel: "Yanıtla",
      href: "/mentor-request/status?id=r1",
    });
    expect(tasks[2].dueLabel).toBe("18 Eylül");
  });

  it("falls back to the owner and the mentorships page for an unlinked item", () => {
    const [task] = buildHomeTasks({
      requests: [],
      meetings: [],
      actionItems: [actionItem({ ownerName: "Kerem Yıldırım", dueDate: null })],
      actionItemRequestIds: {},
      now,
    });

    expect(task).toMatchObject({
      subtitle: "Kerem Yıldırım · Mentorluk görevi",
      dueTone: DueTone.None,
      href: "/mentorships",
    });
  });
});

describe("buildHomeTasks on a shared day", () => {
  it("lists a reply ahead of an action item due that day", () => {
    const tasks = buildHomeTasks({
      requests: [request({ status: MentorshipRequestStatus.CounterProposed })],
      meetings: [],
      actionItems: [actionItem({ dueDate: "2026-09-14" })],
      actionItemRequestIds: {},
      now,
    });

    expect(tasks.map((task) => task.kind)).toEqual([
      HomeTaskKind.RequestReply,
      HomeTaskKind.ActionItem,
    ]);
  });
});

describe("activeMentorshipFooter", () => {
  it("prefers open actions, then the next meeting", () => {
    expect(activeMentorshipFooter(1, null)).toEqual({
      hasOpenActions: true,
      label: "1 açık aksiyon",
    });
    expect(
      activeMentorshipFooter(
        0,
        meeting({ scheduledAt: new Date(2026, 7, 30, 10).toISOString() }),
      ),
    ).toEqual({
      hasOpenActions: false,
      label: "Sonraki görüşme · 30 Ağustos",
    });
    expect(activeMentorshipFooter(0, null)).toEqual({
      hasOpenActions: false,
      label: "Planlı görüşme yok",
    });
  });
});
