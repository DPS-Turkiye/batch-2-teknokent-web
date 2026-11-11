import { beforeEach, describe, expect, it } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  activeMentorshipFooter,
  buildHomeTasks,
  dueState,
  meetingDayLabel,
  meetingWhenLabel,
  readDismissedHomeTasks,
  requestStatusHref,
  sentRequestState,
  writeDismissedHomeTasks,
  type HomeTexts,
} from "@/lib/mentee-home";
import { DueTone, HomeTaskKind, SentRequestState } from "@/types/mentee-home";
import {
  menteeActionItemFixture as actionItem,
  menteeMeetingFixture as meeting,
  menteeRequestFixture as request,
} from "@test/fixtures/mentee-home";
import { translatorIn } from "@test/translators";

const now = new Date(2026, 8, 14, 10, 0);

function homeTexts(locale: "tr" | "en"): HomeTexts {
  return {
    t: translatorIn(locale, "menteeHome"),
    locale,
  };
}
const texts = homeTexts("tr");

describe("dueState", () => {
  it("marks past days overdue and today's date as today", () => {
    expect(dueState("2026-09-13", texts, now)).toEqual({
      tone: DueTone.Overdue,
      label: "Gecikti",
    });
    expect(dueState("2026-09-14", texts, now)).toEqual({
      tone: DueTone.Today,
      label: "Bugün",
    });
  });

  it("shows the day and month for later dates", () => {
    expect(dueState("2026-09-18", texts, now)).toEqual({
      tone: DueTone.Upcoming,
      label: "18 Eylül",
    });
  });

  it("treats a missing or unreadable date as undated", () => {
    expect(dueState(null, texts, now).tone).toBe(DueTone.None);
    expect(dueState("not-a-date", texts, now).tone).toBe(DueTone.None);
  });

  it("reads a full timestamp in the viewer's own day", () => {
    expect(
      dueState(new Date(2026, 8, 14, 23, 30).toISOString(), texts, now),
    ).toEqual({
      tone: DueTone.Today,
      label: "Bugün",
    });
    expect(
      dueState(new Date(2026, 8, 15, 0, 30).toISOString(), texts, now).label,
    ).toBe("15 Eylül");
  });
});

describe("meetingWhenLabel", () => {
  it("names tomorrow and marks a linked meeting as online", () => {
    expect(
      meetingWhenLabel(
        meeting({ meetLink: "https://meet.google.com/abc-defg-hij" }),
        texts,
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
        texts,
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
        texts,
        now,
      ),
    ).toBe("20 Eylül · 09:30 · 60 dk");
  });

  it("writes the label in English", () => {
    expect(
      meetingWhenLabel(
        meeting({ meetLink: "https://meet.google.com/abc-defg-hij" }),
        homeTexts("en"),
        now,
      ),
    ).toBe("Tomorrow · 02:00 PM · 45 min · Online");
  });
});

describe("meetingDayLabel", () => {
  it("includes the year", () => {
    expect(
      meetingDayLabel(
        meeting({ scheduledAt: new Date(2026, 7, 18, 10).toISOString() }),
        "tr",
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
      texts,
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
    expect(tasks[2]?.dueLabel).toBe("18 Eylül");
  });

  it("falls back to the owner and the mentorships page for an unlinked item", () => {
    const [task] = buildHomeTasks({
      requests: [],
      meetings: [],
      actionItems: [actionItem({ ownerName: "Kerem Yıldırım", dueDate: null })],
      actionItemRequestIds: {},
      texts,
      now,
    });

    expect(task).toMatchObject({
      subtitle: "Kerem Yıldırım · Mentorluk görevi",
      dueTone: DueTone.None,
      href: "/mentorships",
    });
  });

  it("says a task was handed over from someone who left the team", () => {
    const [task] = buildHomeTasks({
      requests: [],
      meetings: [],
      actionItems: [
        actionItem({
          ownerName: "Ece Demir",
          previousOwnerName: "Kerem Yıldırım",
          ownerLeftAt: "2026-11-04T09:00:00Z",
        }),
      ],
      actionItemRequestIds: {},
      texts,
      now,
    });

    expect(task?.subtitle).toBe(
      "Ece Demir · Mentorluk görevi · Kerem Yıldırım ekipten ayrıldı, sana devredildi",
    );
  });

  it("adds an evaluation task for a finished meeting", () => {
    const [task] = buildHomeTasks({
      requests: [
        request({
          id: "r3",
          status: MentorshipRequestStatus.Accepted,
          mentorName: "Selin Kaya",
          supportArea: "Finans Mentorluğu",
        }),
      ],
      meetings: [],
      actionItems: [],
      actionItemRequestIds: {},
      feedbackMeetings: [
        meeting({
          id: "ended-1",
          mentorshipRequestId: "r3",
          mentorName: "Selin Kaya",
          agenda: "KPI görüşmesi",
          scheduledAt: new Date(2026, 8, 10, 14, 0).toISOString(),
          status: MeetingStatus.Completed,
        }),
      ],
      texts,
      now,
    });

    expect(task).toMatchObject({
      id: "feedback-ended-1",
      kind: HomeTaskKind.MeetingFeedback,
      title: "Toplantıyı değerlendir",
      subtitle: "Selin Kaya · KPI görüşmesi",
      dueTone: DueTone.Overdue,
      actionLabel: "Değerlendir",
      href: "/meetings/research/feedback?id=ended-1",
    });
  });

  it("hides a dismissed evaluation from the list", () => {
    const tasks = buildHomeTasks({
      requests: [],
      meetings: [],
      actionItems: [],
      actionItemRequestIds: {},
      feedbackMeetings: [
        meeting({
          id: "ended-1",
          scheduledAt: new Date(2026, 8, 10, 14, 0).toISOString(),
          status: MeetingStatus.Completed,
        }),
      ],
      dismissedTaskIds: ["feedback-ended-1"],
      texts,
      now,
    });

    expect(tasks).toEqual([]);
  });
});

describe("dismissed home tasks", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores dismissed ids per user", () => {
    writeDismissedHomeTasks("mentee-1", ["feedback-ended-1"]);
    expect(readDismissedHomeTasks("mentee-1")).toEqual(["feedback-ended-1"]);
    expect(readDismissedHomeTasks("mentee-2")).toEqual([]);
  });
});

describe("buildHomeTasks on a shared day", () => {
  it("lists a reply ahead of an action item due that day", () => {
    const tasks = buildHomeTasks({
      requests: [request({ status: MentorshipRequestStatus.CounterProposed })],
      meetings: [],
      actionItems: [actionItem({ dueDate: "2026-09-14" })],
      actionItemRequestIds: {},
      texts,
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
    expect(activeMentorshipFooter(1, null, texts)).toEqual({
      hasOpenActions: true,
      label: "1 açık aksiyon",
    });
    expect(
      activeMentorshipFooter(
        0,
        meeting({ scheduledAt: new Date(2026, 7, 30, 10).toISOString() }),
        texts,
      ),
    ).toEqual({
      hasOpenActions: false,
      label: "Sonraki görüşme · 30 Ağustos",
    });
    expect(activeMentorshipFooter(0, null, texts)).toEqual({
      hasOpenActions: false,
      label: "Planlı görüşme yok",
    });
  });

  it("counts open actions in English", () => {
    expect(activeMentorshipFooter(2, null, homeTexts("en")).label).toBe(
      "2 open actions",
    );
    expect(activeMentorshipFooter(1, null, homeTexts("en")).label).toBe(
      "1 open action",
    );
  });
});
