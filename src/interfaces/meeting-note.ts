import type { MeetingReport, TranscriptLine } from "@/types/assistant";

export type MeetingNote = {
  meetingId: string;
  content: string;
  version: number;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
};

/** AI: added from the meeting report's action items; editable like any other task. */
export enum MeetingTodoSource {
  Manual = "MANUAL",
  Ai = "AI",
}

export type MeetingTodo = {
  id: string;
  meetingId: string;
  title: string;
  done: boolean;
  displayOrder: number;
  createdByName?: string | null;
  source?: MeetingTodoSource;
  updatedAt?: string | null;
};

export type MeetingNoteDocument = {
  state: string | null;
  seedFromSnapshot: boolean;
};

export enum MeetingRoomEventType {
  DocumentUpdated = "DOCUMENT_UPDATED",
  PresenceUpdated = "PRESENCE_UPDATED",
  TodosUpdated = "TODOS_UPDATED",
}

export type MeetingRoomEvent = {
  type: MeetingRoomEventType;
  todos?: MeetingTodo[] | null;
  update?: string | null;
};

export type RealtimeToken = {
  token: string;
  expiresAt: string;
};

export type MeetingAssistantShare = {
  meetingId: string;
  transcript: TranscriptLine[] | null;
  transcriptUrl?: string | null;
  transcriptPublishedAt: string | null;
  report: MeetingReport | null;
  reportUrl?: string | null;
  reportPublishedAt: string | null;
};

export type PublishAssistantSharePayload =
  | {
      kind: "TRANSCRIPT";
      transcript: TranscriptLine[];
    }
  | {
      kind: "PROVIDER_TRANSCRIPT";
      platform: string;
      nativeMeetingId: string;
    }
  | {
      kind: "TRANSCRIPT_S3";
    }
  | {
      kind: "REPORT";
      report: MeetingReport;
    }
  | {
      kind: "REPORT_S3";
    };
