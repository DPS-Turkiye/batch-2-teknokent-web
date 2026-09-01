import type { MeetingReport, TranscriptLine } from "@/types/assistant";

export type MeetingNote = {
  meetingId: string;
  content: string;
  version: number;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
};

export type MeetingTodo = {
  id: string;
  meetingId: string;
  title: string;
  done: boolean;
  displayOrder: number;
  createdByName?: string | null;
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
  transcriptPublishedAt: string | null;
  report: MeetingReport | null;
  reportPublishedAt: string | null;
};

export type PublishAssistantSharePayload =
  | {
      kind: "TRANSCRIPT";
      transcript: TranscriptLine[];
    }
  | {
      kind: "REPORT";
      report: MeetingReport;
    };
