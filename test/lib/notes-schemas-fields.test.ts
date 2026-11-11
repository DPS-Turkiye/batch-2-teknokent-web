import { describe, expect, it } from "vitest";

import {
  createMeetingTodoBodySchema,
  publishAssistantShareBodySchema,
  saveMeetingNoteBodySchema,
  updateMeetingTodoBodySchema,
} from "@/lib/notes-schemas";

describe("meeting note schemas", () => {
  it("accepts note content up to 200 000 characters and refuses more", () => {
    expect(
      saveMeetingNoteBodySchema.safeParse({ content: "a".repeat(200000) })
        .success,
    ).toBe(true);
    expect(
      saveMeetingNoteBodySchema.safeParse({ content: "a".repeat(200001) })
        .success,
    ).toBe(false);
  });

  it("trims a todo title and refuses one that is only spaces", () => {
    expect(createMeetingTodoBodySchema.parse({ title: "  Deck  " })).toEqual({
      title: "Deck",
    });
    expect(
      createMeetingTodoBodySchema.safeParse({ title: "   " }).success,
    ).toBe(false);
  });

  it("updates a todo by its title, its done flag or both", () => {
    expect(updateMeetingTodoBodySchema.parse({ done: false })).toEqual({
      done: false,
    });
    expect(updateMeetingTodoBodySchema.parse({ title: " Yeni " })).toEqual({
      title: "Yeni",
    });
  });

  it("refuses a todo update that changes nothing, with the reason", () => {
    const result = updateMeetingTodoBodySchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Bir başlık veya tamamlanma durumu girin.",
    );
  });
});

describe("assistant share schema", () => {
  it("names a transcript line without an id by its time and text, and an unnamed speaker 'Speaker'", () => {
    const parsed = publishAssistantShareBodySchema.parse({
      kind: "TRANSCRIPT",
      transcript: [
        { id: "  ", speaker: "  ", text: "Merhaba", at: 12 },
        { id: "l-2", speaker: "Ada", text: true, at: null },
      ],
    });

    expect(parsed).toEqual({
      kind: "TRANSCRIPT",
      transcript: [
        { id: "12-Merhaba", speaker: "Speaker", text: "Merhaba", at: "12" },
        { id: "l-2", speaker: "Ada", text: "true", at: "" },
      ],
    });
  });

  it("refuses an empty transcript", () => {
    expect(
      publishAssistantShareBodySchema.safeParse({
        kind: "TRANSCRIPT",
        transcript: [],
      }).success,
    ).toBe(false);
  });

  it("refuses a provider transcript without a platform", () => {
    expect(
      publishAssistantShareBodySchema.safeParse({
        kind: "PROVIDER_TRANSCRIPT",
        platform: "  ",
        nativeMeetingId: "abc",
      }).success,
    ).toBe(false);
  });

  it("cleans a report: blank texts become null, list entries become non-empty strings", () => {
    const parsed = publishAssistantShareBodySchema.parse({
      kind: "REPORT",
      report: {
        title: "Haftalık",
        meetingDate: "   ",
        topic: " Fon ",
        summary: 5,
        topicsDiscussed: ["Bütçe", null, "  ", 3],
        actionItems: [{ owner: null, task: "Deck", due: " " }],
        model: "gpt",
      },
    });

    expect(parsed).toEqual({
      kind: "REPORT",
      report: {
        title: "Haftalık",
        meetingDate: null,
        topic: "Fon",
        summary: "5",
        topicsDiscussed: ["Bütçe", "3"],
        decisions: [],
        actionItems: [{ owner: null, task: "Deck", due: null }],
        risksOrBlockers: [],
        nextSteps: [],
        model: "gpt",
      },
    });
  });

  it("refuses an unknown share kind", () => {
    expect(
      publishAssistantShareBodySchema.safeParse({ kind: "AUDIO" }).success,
    ).toBe(false);
  });
});
