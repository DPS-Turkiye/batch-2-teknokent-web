import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MeetingAssistantShare } from "@/interfaces/meeting-note";
import {
  getAssistantShare,
  getMeetingNote,
  getMeetingNoteDocument,
  getMeetingTodos,
  patchMeetingTodo,
  postMeetingTodo,
  postRealtimeToken,
  putJsonToPresignedUrl,
  putMeetingNote,
  putTranscriptToPresignedUrl,
  removeMeetingTodo,
  type TranscriptUploadUrl,
} from "@/lib/client/meeting-notes";
import { httpClient } from "@/lib/http-client";
import type { TranscriptLine } from "@/types/assistant";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const M = "/api/meetings/m%2F1";

const calls: ClientCall[] = [
  {
    title: "getMeetingNote reads the encoded meeting's note",
    call: () => getMeetingNote("m/1"),
    method: "get",
    args: [`${M}/note`],
  },
  {
    title: "getMeetingNoteDocument reads the note's document",
    call: () => getMeetingNoteDocument("m/1"),
    method: "get",
    args: [`${M}/note/document`],
  },
  {
    title: "putMeetingNote puts the note's content",
    call: () => putMeetingNote("m/1", { content: "Notlar" }),
    method: "put",
    args: [`${M}/note`, { content: "Notlar" }],
  },
  {
    title: "getMeetingTodos lists the meeting's to-dos",
    call: () => getMeetingTodos("m/1"),
    method: "get",
    args: [`${M}/todos`],
  },
  {
    title: "postMeetingTodo posts the new to-do's title",
    call: () => postMeetingTodo("m/1", "Sunumu gönder"),
    method: "post",
    args: [`${M}/todos`, { title: "Sunumu gönder" }],
  },
  {
    title: "patchMeetingTodo patches the encoded to-do",
    call: () => patchMeetingTodo("m/1", "t/1", { done: true }),
    method: "patch",
    args: [`${M}/todos/t%2F1`, { done: true }],
  },
  {
    title: "removeMeetingTodo deletes the encoded to-do",
    call: () => removeMeetingTodo("m/1", "t/1"),
    method: "delete",
    args: [`${M}/todos/t%2F1`],
  },
  {
    title: "postRealtimeToken asks for a realtime token",
    call: () => postRealtimeToken(),
    method: "post",
    args: ["/api/realtime/token"],
  },
];

const line: TranscriptLine = {
  id: "s1",
  speaker: "Ayşe",
  text: "Merhaba",
  at: "00:10",
};

function share(
  overrides: Partial<MeetingAssistantShare>,
): MeetingAssistantShare {
  return {
    meetingId: "m-1",
    transcript: null,
    transcriptPublishedAt: null,
    report: null,
    reportPublishedAt: null,
    ...overrides,
  };
}

const upload: TranscriptUploadUrl = {
  url: "https://s3.example/put",
  method: "PUT",
  key: "meetings/m-1/transcript.json",
  contentType: "application/json",
};

describe("meeting notes client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  itSendsEachClientCall(calls);

  describe("getAssistantShare", () => {
    it("keeps an inline transcript and leaves a missing report empty, fetching nothing", async () => {
      const fetchMock = vi.fn<typeof fetch>();
      vi.stubGlobal("fetch", fetchMock);
      vi.mocked(httpClient.get).mockResolvedValue(
        createMentorResponse(share({ transcript: [line] })),
      );

      const result = await getAssistantShare("m-1");

      expect(result.transcript).toEqual([line]);
      expect(result.report).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fails with a readable message when a stored transcript cannot be read", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>(
          async () => new Response("denied", { status: 403 }),
        ),
      );
      vi.mocked(httpClient.get).mockResolvedValue(
        createMentorResponse(
          share({ transcriptUrl: "https://s3.example/transcript" }),
        ),
      );

      await expect(getAssistantShare("m-1")).rejects.toThrow(
        "Not defterindeki transkript veya rapor okunamadı.",
      );
    });
  });

  describe("putJsonToPresignedUrl", () => {
    it("puts the JSON body with the upload's method and content type", async () => {
      const fetchMock = vi.fn<typeof fetch>(
        async () => new Response(null, { status: 200 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await putJsonToPresignedUrl(
        { ...upload, method: "POST", contentType: "text/plain" },
        { a: 1 },
        "olmadı",
      );

      expect(fetchMock).toHaveBeenCalledWith("https://s3.example/put", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: '{"a":1}',
      });
    });

    it("falls back to a JSON PUT when the upload names no method or type", async () => {
      const fetchMock = vi.fn<typeof fetch>(
        async () => new Response(null, { status: 200 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await putJsonToPresignedUrl(
        { ...upload, method: "", contentType: "" },
        [],
        "olmadı",
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "https://s3.example/put",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("names the bucket's CORS rule when S3 refuses the origin", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>(async () => new Response(null, { status: 403 })),
      );

      await expect(putJsonToPresignedUrl(upload, {}, "olmadı")).rejects.toThrow(
        /S3 CORS/,
      );
    });

    it("throws the caller's message for any other failed upload", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>(async () => new Response(null, { status: 500 })),
      );

      await expect(putTranscriptToPresignedUrl(upload, [line])).rejects.toThrow(
        "Transkript S3'e yüklenemedi.",
      );
    });
  });
});
