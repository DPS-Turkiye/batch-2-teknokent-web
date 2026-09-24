import { describe, expect, it } from "vitest";

import { CoordinatorConversationCounterpart } from "@/interfaces/coordinator-conversation";
import { CoordinatorMentorshipHealth } from "@/interfaces/coordinator-mentorship";
import {
  conversationTime,
  counterpartSubtitle,
  filterConversations,
  isUnread,
  MessageFilter,
  messageDayLabel,
  messageFilterOptions,
  messagesSubtitle,
  relatedMentorships,
} from "@/lib/coordinator-messages";
import { coordinatorConversation } from "@test/fixtures/coordinator-conversations";
import { coordinatorMentorship } from "@test/fixtures/coordinator-mentorships";

const ayse = coordinatorConversation();
const lumen = coordinatorConversation({
  id: "conversation-2",
  counterpartType: CoordinatorConversationCounterpart.Team,
  counterpartId: "org-1",
  counterpartName: "Lumen",
  lastMessagePreview: "Nakit akışı tablosu hazır",
});
const terra = coordinatorConversation({
  id: "conversation-3",
  programId: "program-2",
  counterpartType: CoordinatorConversationCounterpart.Team,
  counterpartId: "org-3",
  counterpartName: "Terra",
  unread: false,
});
const mentorships = [
  coordinatorMentorship(),
  coordinatorMentorship({
    id: "mentorship-2",
    organizationId: "org-2",
    organizationName: "Kavun",
    health: CoordinatorMentorshipHealth.Healthy,
  }),
];

describe("coordinator messages", () => {
  it("counts unread threads per side, treating the open one as read", () => {
    expect(
      messageFilterOptions([ayse, lumen, terra], null).map((o) => o.label),
    ).toEqual(["Tümü", "Mentorlar 1", "Takımlar 1"]);
    expect(
      messageFilterOptions([ayse, lumen, terra], "conversation-1").map(
        (o) => o.label,
      ),
    ).toEqual(["Tümü", "Mentorlar 0", "Takımlar 1"]);
    expect(isUnread(ayse, "conversation-1")).toBe(false);
  });

  it("filters by side, program and text", () => {
    const all = [ayse, lumen, terra];
    const ids = (
      filter: MessageFilter,
      search = "",
      programId: string | null = null,
    ) =>
      filterConversations(all, { filter, search, programId }).map((c) => c.id);
    expect(ids(MessageFilter.Teams)).toEqual([
      "conversation-2",
      "conversation-3",
    ]);
    expect(ids(MessageFilter.All, "", "program-2")).toEqual(["conversation-3"]);
    expect(ids(MessageFilter.All, "NAKİT")).toEqual(["conversation-2"]);
  });

  it("links a thread to the mentorships of its counterpart", () => {
    expect(relatedMentorships(ayse, mentorships).map((r) => r.id)).toEqual([
      "mentorship-1",
      "mentorship-2",
    ]);
    expect(relatedMentorships(lumen, mentorships).map((r) => r.id)).toEqual([
      "mentorship-1",
    ]);
    expect(relatedMentorships(terra, mentorships)).toEqual([]);
    expect(counterpartSubtitle(ayse, mentorships)).toBe(
      "Mentor · Lumen, Kavun",
    );
    expect(counterpartSubtitle(lumen, [mentorships[0]])).toBe(
      "Takım · Ayşe Demir",
    );
    expect(counterpartSubtitle(terra, [])).toBe("Takım");
    expect(messagesSubtitle([ayse, lumen, terra], mentorships, null)).toBe(
      "2 okunmamış mesaj · 2 konuşma riskli bir mentorlukla ilgili",
    );
  });

  it("formats times relative to today", () => {
    const now = new Date(2026, 8, 24, 12, 0);
    expect(
      conversationTime(new Date(2026, 8, 24, 10, 24).toISOString(), now),
    ).toBe("10:24");
    expect(
      conversationTime(new Date(2026, 8, 23, 18, 0).toISOString(), now),
    ).toBe("Dün");
    expect(
      conversationTime(new Date(2026, 8, 21, 9, 0).toISOString(), now),
    ).toBe("Pzt");
    expect(
      conversationTime(new Date(2026, 8, 2, 9, 0).toISOString(), now),
    ).toBe("2 Eyl");
    expect(conversationTime(null, now)).toBe("");
    expect(messageDayLabel(new Date(2026, 8, 24, 9).toISOString(), now)).toBe(
      "Bugün",
    );
  });
});
