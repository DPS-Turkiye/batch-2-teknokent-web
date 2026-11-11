import { describe, expect, it } from "vitest";

import {
  CoordinatorConversationCounterpart,
  type CoordinatorConversation,
} from "@/interfaces/coordinator-conversation";
import {
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
  type RequestMessage,
} from "@/interfaces/mentorship-request";
import { MobileChatItemKind } from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import {
  groupedMentorshipConversations,
  mentorshipChatItems,
  mentorshipChatSubtitle,
  mentorshipConversation,
  mentorshipUnreadCount,
  newestFirst,
  nextMeetingStrip,
  programChatItems,
  programConversation,
  searchConversations,
  threadTopics,
} from "@/lib/mobile-messages";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { mobileTexts } from "@test/mobile-texts";

const NOW = new Date(2026, 8, 25, 12, 0);
const TR = mobileTexts("tr");
const EN = mobileTexts("en");
const MENTOR = "mentor-1";
const MENTEE = "mentee-1";

function message(
  id: string,
  authorId: string,
  createdAt: string,
  body = "Merhaba",
): RequestMessage {
  return {
    id,
    authorId,
    authorName: authorId === MENTOR ? "Barış Öztürk" : "Gamze Kozak",
    messageType:
      authorId === MENTOR
        ? MentorshipRequestMessageType.MentorMessage
        : MentorshipRequestMessageType.MenteeMessage,
    body,
    createdAt,
  };
}

function thread(overrides = {}) {
  return menteeRequestFixture({
    status: MentorshipRequestStatus.Accepted,
    requesterName: "Gamze Kozak",
    organizationName: "Atlas AI",
    messages: [
      message("a", MENTEE, "2026-09-24T09:00:00Z"),
      message("b", MENTOR, "2026-09-24T10:00:00Z"),
      message(
        "c",
        MENTOR,
        "2026-09-25T08:00:00Z",
        "Dosya paylaşıldı: plan.pdf",
      ),
    ],
    ...overrides,
  });
}

function programThread(
  overrides: Partial<CoordinatorConversation> = {},
): CoordinatorConversation {
  return {
    id: "p1",
    programId: "program-1",
    programName: "METU Stars",
    counterpartType: CoordinatorConversationCounterpart.Team,
    counterpartId: "org-1",
    counterpartName: "Atlas AI",
    coordinatorId: "coordinator-1",
    coordinatorName: "Burcu Şen",
    lastMessagePreview: "Ara rapor teslimi yaklaşıyor.",
    lastMessageAt: "2026-09-23T09:00:00Z",
    unread: true,
    unreadCount: 2,
    otherSideReadAt: null,
    ...overrides,
  };
}

describe("mentorshipUnreadCount", () => {
  it("counts the mentor's messages after the team last read the thread", () => {
    const request = thread({ menteeReadAt: "2026-09-24T12:00:00Z" });

    expect(mentorshipUnreadCount(request, UserRole.Mentee)).toBe(1);
  });

  it("counts the team's messages for the mentor, all of them when never read", () => {
    expect(mentorshipUnreadCount(thread(), UserRole.Mentor)).toBe(1);
    expect(
      mentorshipUnreadCount(
        thread({ mentorReadAt: "2026-09-24T09:30:00Z" }),
        UserRole.Mentor,
      ),
    ).toBe(0);
  });
});

describe("mentorshipConversation", () => {
  it("names the mentor for a mentee and shows a shared file as its name", () => {
    const conversation = mentorshipConversation(
      thread({ menteeReadAt: "2026-09-24T12:00:00Z" }),
      UserRole.Mentee,
      TR,
      NOW,
    );

    expect(conversation).toMatchObject({
      name: "Barış Öztürk",
      tag: "Mentor",
      preview: "📎 plan.pdf",
      unreadCount: 1,
      href: "/m/messages/mentorship/r1",
    });
  });

  it("shows the request's topic for a thread with no messages yet", () => {
    expect(
      mentorshipConversation(thread({ messages: [] }), UserRole.Mentee, TR, NOW)
        .preview,
    ).toBe("Teknik ekip kurulumu");
  });

  it("names the startup for a mentor", () => {
    const conversation = mentorshipConversation(
      thread(),
      UserRole.Mentor,
      TR,
      NOW,
    );

    expect(conversation.name).toBe("Atlas AI");
    expect(conversation.tag).toBe("Gamze Kozak");
    expect(conversation.isStartup).toBe(true);
  });
});

describe("programConversation", () => {
  it("shows the program with the server's unread count", () => {
    expect(programConversation(programThread(), TR, NOW)).toMatchObject({
      name: "METU Stars",
      tag: "Program",
      unreadCount: 2,
      href: "/m/messages/program/p1",
    });
  });

  it("says when an empty program thread has no messages, in English too", () => {
    const empty = programThread({ lastMessagePreview: null });
    expect(programConversation(empty, TR, NOW).preview).toBe("Henüz mesaj yok");
    expect(programConversation(empty, EN, NOW).preview).toBe("No messages yet");
  });

  it("falls back to one unread when an older server sends only the flag", () => {
    const { unreadCount: _unreadCount, ...olderThread } = programThread();
    expect(programConversation(olderThread, TR, NOW).unreadCount).toBe(1);
  });

  it("names a thread whose program the server could not resolve as Program", () => {
    const orphan = programThread({ programName: null, coordinatorName: null });
    expect(programConversation(orphan, TR, NOW)).toMatchObject({
      name: "Program",
      initials: "P",
    });
  });
});

describe("newestFirst and searchConversations", () => {
  it("orders by the last message and finds names regardless of Turkish case", () => {
    const list = newestFirst([
      programConversation(programThread(), TR, NOW),
      mentorshipConversation(thread(), UserRole.Mentee, TR, NOW),
    ]);

    expect(list.map((item) => item.name)).toEqual([
      "Barış Öztürk",
      "METU Stars",
    ]);
    expect(
      searchConversations(list, "BARIŞ", "tr").map((item) => item.name),
    ).toEqual(["Barış Öztürk"]);
    expect(searchConversations(list, "  ", "tr")).toHaveLength(2);
  });

  it("finds a mentor's startup thread by the person who wrote in, but not by a mentee's tag", () => {
    const mentor = [mentorshipConversation(thread(), UserRole.Mentor, TR, NOW)];
    const mentee = [mentorshipConversation(thread(), UserRole.Mentee, TR, NOW)];

    expect(searchConversations(mentor, "gamze", "tr")).toHaveLength(1);
    expect(searchConversations(mentee, "mentor", "tr")).toHaveLength(0);
  });
});

describe("grouped threads", () => {
  const older = thread({
    id: "r-old",
    supportArea: "Strateji",
    messages: [message("x", MENTOR, "2026-09-20T09:00:00Z")],
  });
  const newer = thread({ id: "r-new", supportArea: "Yatırım" });

  it("shows one row per mentor with the newest thread and every topic's unread", () => {
    const [row, ...rest] = groupedMentorshipConversations(
      [older, newer],
      UserRole.Mentee,
      TR,
      NOW,
    );

    expect(rest).toEqual([]);
    expect(row).toMatchObject({ id: "r-new", unreadCount: 3 });
  });

  it("lists the topics with the same mentor, newest first, marking the open one", () => {
    expect(
      threadTopics([older, newer], older, UserRole.Mentee, TR).map((topic) => [
        topic.topic,
        topic.isCurrent,
      ]),
    ).toEqual([
      ["Yatırım", false],
      ["Strateji", true],
    ]);
  });

  it("hides the machine-readable slot line from previews and bubbles", () => {
    const proposal = thread({
      messages: [
        message(
          "p",
          MENTOR,
          "2026-09-24T09:00:00Z",
          "Mentörün önerdiği saatler: 10 Eylül · 17:00\nproposedSlots:2026-09-10T17:00",
        ),
      ],
    });

    expect(
      mentorshipConversation(proposal, UserRole.Mentee, TR, NOW).preview,
    ).toBe("Mentörün önerdiği saatler: 10 Eylül · 17:00");
    expect(
      mentorshipChatItems(proposal, UserRole.Mentee, MENTEE, "tr", NOW).at(-1),
    ).toMatchObject({ body: "Mentörün önerdiği saatler: 10 Eylül · 17:00" });
  });
});

describe("mentorshipChatItems", () => {
  it("adds a day separator per day and ticks only the viewer's messages the other side has read", () => {
    const items = mentorshipChatItems(
      thread({ mentorReadAt: "2026-09-24T09:30:00Z" }),
      UserRole.Mentee,
      MENTEE,
      "tr",
      NOW,
    );

    expect(items.map((item) => item.kind)).toEqual([
      MobileChatItemKind.Day,
      MobileChatItemKind.Message,
      MobileChatItemKind.Message,
      MobileChatItemKind.Day,
      MobileChatItemKind.Message,
    ]);
    const [, mine, theirs, today, file] = items;
    expect(mine).toMatchObject({ mine: true, read: true });
    expect(theirs).toMatchObject({ mine: false, read: false });
    expect(today).toMatchObject({ label: "Bugün" });
    expect(file).toMatchObject({ fileName: "plan.pdf" });

    const english = mentorshipChatItems(
      thread(),
      UserRole.Mentee,
      MENTEE,
      "en",
      NOW,
    );
    expect(english[3]).toMatchObject({ label: "Today" });
  });
});

describe("programChatItems", () => {
  it("ticks the viewer's messages up to the other side's read mark", () => {
    const items = programChatItems(
      [
        {
          id: "m1",
          senderId: MENTEE,
          senderName: "Gamze Kozak",
          mine: true,
          body: "Teşekkürler",
          createdAt: "2026-09-25T08:00:00Z",
        },
        {
          id: "m2",
          senderId: MENTEE,
          senderName: "Gamze Kozak",
          mine: true,
          body: "Bir sorum var",
          createdAt: "2026-09-25T09:00:00Z",
        },
      ],
      "2026-09-25T08:30:00Z",
      "tr",
      NOW,
    );

    const messages = items.filter(
      (item) => item.kind === MobileChatItemKind.Message,
    );
    expect(messages.map((item) => "read" in item && item.read)).toEqual([
      true,
      false,
    ]);
  });
});

describe("chat header and meeting strip", () => {
  it("describes the thread from the viewer's side", () => {
    expect(mentorshipChatSubtitle(thread(), UserRole.Mentee, TR)).toBe(
      "Mentor · Teknik ekip kurulumu",
    );
    expect(mentorshipChatSubtitle(thread(), UserRole.Mentor, TR)).toBe(
      "Gamze Kozak · Teknik ekip kurulumu",
    );
    expect(
      mentorshipChatSubtitle(thread(), UserRole.Mentor, TR, "METU Stars 2026"),
    ).toBe("METU Stars 2026 · Gamze Kozak");
  });

  it("names the day of the next meeting", () => {
    const meeting = menteeMeetingFixture({
      scheduledAt: new Date(2026, 8, 26, 14, 0).toISOString(),
    });

    expect(nextMeetingStrip(meeting, TR, NOW)).toBe(
      "Sıradaki görüşme: Yarın 14:00",
    );
    expect(nextMeetingStrip(meeting, EN, NOW)).toBe(
      "Next meeting: Tomorrow 02:00 PM",
    );
  });
});
