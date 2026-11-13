import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_REALTIME_URL,
  getAssistantShareApiUrl,
  getAssistantShareReportUploadApiUrl,
  getAssistantShareTranscriptUploadApiUrl,
  getMeetingBotApiUrl,
  getMeetingDocumentDestination,
  getMeetingNoteApiUrl,
  getMeetingNoteDocumentApiUrl,
  getMeetingPresenceDestination,
  getMeetingReportApiUrl,
  getMeetingRoomTopic,
  getMeetingTodoApiUrl,
  getMeetingTodosApiUrl,
  getRealtimeUrl,
  getTranscriptApiUrl,
} from "@/lib/const";

describe("realtime URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured realtime server", () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_URL", "wss://rt.menton.test/ws");

    expect(getRealtimeUrl()).toBe("wss://rt.menton.test/ws");
  });

  it("falls back to the local realtime server when none is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_URL", undefined);

    expect(getRealtimeUrl()).toBe(DEFAULT_REALTIME_URL);
  });
});

describe("meeting API URLs", () => {
  it("encodes the meeting id in every note and share route", () => {
    expect(getMeetingNoteApiUrl("m/1")).toBe("/api/meetings/m%2F1/note");
    expect(getMeetingNoteDocumentApiUrl("m/1")).toBe(
      "/api/meetings/m%2F1/note/document",
    );
    expect(getMeetingTodosApiUrl("m/1")).toBe("/api/meetings/m%2F1/todos");
    expect(getAssistantShareApiUrl("m/1")).toBe(
      "/api/meetings/m%2F1/assistant-share",
    );
    expect(getAssistantShareTranscriptUploadApiUrl("m/1")).toBe(
      "/api/meetings/m%2F1/assistant-share/transcript-upload",
    );
    expect(getAssistantShareReportUploadApiUrl("m/1")).toBe(
      "/api/meetings/m%2F1/assistant-share/report-upload",
    );
  });

  it("encodes both the meeting and the todo id of a single todo", () => {
    expect(getMeetingTodoApiUrl("m/1", "t 2")).toBe(
      "/api/meetings/m%2F1/todos/t%202",
    );
  });

  it("puts the platform and the provider's meeting id in the bot routes' query", () => {
    expect(getMeetingBotApiUrl("google_meet", "abc def")).toBe(
      "/api/botapi?platform=google_meet&nativeMeetingId=abc+def",
    );
    expect(getTranscriptApiUrl("zoom", "1&2")).toBe(
      "/api/transcriptapi?platform=zoom&nativeMeetingId=1%262",
    );
    expect(getMeetingReportApiUrl("teams", "x")).toBe(
      "/api/botapi/report?platform=teams&nativeMeetingId=x",
    );
  });
});

describe("meeting socket destinations", () => {
  it("names the meeting's room topic and its document and presence destinations", () => {
    expect(getMeetingRoomTopic("m-1")).toBe("/topic/meetings/m-1");
    expect(getMeetingDocumentDestination("m-1")).toBe(
      "/app/meetings/m-1/document",
    );
    expect(getMeetingPresenceDestination("m-1")).toBe(
      "/app/meetings/m-1/presence",
    );
  });
});
