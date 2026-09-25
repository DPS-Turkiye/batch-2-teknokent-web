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
  mentorshipChatItems,
  mentorshipChatSubtitle,
  mentorshipConversation,
  mentorshipUnreadCount,
  newestFirst,
  nextMeetingStrip,
  programChatItems,
  programConversation,
  searchConversations,
} from "@/lib/mobile-messages";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";

const NOW = new Date(2026, 8, 25, 12, 0);
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
      mentorshipConversation(thread({ messages: [] }), UserRole.Mentee, NOW)
        .preview,
    ).toBe("Teknik ekip kurulumu");
  });

  it("names the startup for a mentor", () => {
    const conversation = mentorshipConversation(thread(), UserRole.Mentor, NOW);

    expect(conversation.name).toBe("Atlas AI");
    expect(conversation.tag).toBe("Startup");
  });
});

describe("programConversation", () => {
  it("shows the program with the server's unread count", () => {
    expect(programConversation(programThread(), NOW)).toMatchObject({
      name: "METU Stars",
      tag: "Program",
      unreadCount: 2,
      href: "/m/messages/program/p1",
    });
  });

  it("falls back to one unread when an older server sends only the flag", () => {
    expect(
      programConversation(programThread({ unreadCount: undefined }), NOW)
        .unreadCount,
    ).toBe(1);
  });
});

describe("newestFirst and searchConversations", () => {
  it("orders by the last message and finds names regardless of Turkish case", () => {
    const list = newestFirst([
      programConversation(programThread(), NOW),
      mentorshipConversation(thread(), UserRole.Mentee, NOW),
    ]);

    expect(list.map((item) => item.name)).toEqual([
      "Barış Öztürk",
      "METU Stars",
    ]);
    expect(searchConversations(list, "BARIŞ").map((item) => item.name)).toEqual(
      ["Barış Öztürk"],
    );
    expect(searchConversations(list, "  ")).toHaveLength(2);
  });
});

describe("mentorshipChatItems", () => {
  it("adds a day separator per day and ticks only the viewer's messages the other side has read", () => {
    const items = mentorshipChatItems(
      thread({ mentorReadAt: "2026-09-24T09:30:00Z" }),
      UserRole.Mentee,
      MENTEE,
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
    expect(mentorshipChatSubtitle(thread(), UserRole.Mentee)).toBe(
      "Mentor · Teknik ekip kurulumu",
    );
    expect(mentorshipChatSubtitle(thread(), UserRole.Mentor)).toBe(
      "Gamze Kozak · Teknik ekip kurulumu",
    );
  });

  it("names the day of the next meeting", () => {
    const meeting = menteeMeetingFixture({
      scheduledAt: new Date(2026, 8, 26, 14, 0).toISOString(),
    });

    expect(nextMeetingStrip(meeting, NOW)).toBe(
      "Sıradaki görüşme: Yarın 14:00",
    );
  });
});
