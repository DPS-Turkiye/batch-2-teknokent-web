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

/** What a mentor shares from the meeting assistant; the backend's share kinds, plus a provider transcript fetched first. */
export enum AssistantShareKind {
  Transcript = "TRANSCRIPT",
  ProviderTranscript = "PROVIDER_TRANSCRIPT",
  TranscriptS3 = "TRANSCRIPT_S3",
  Report = "REPORT",
  ReportS3 = "REPORT_S3",
}

export type PublishAssistantSharePayload =
  | {
      kind: AssistantShareKind.Transcript;
      transcript: TranscriptLine[];
    }
  | {
      kind: AssistantShareKind.ProviderTranscript;
      platform: string;
      nativeMeetingId: string;
    }
  | {
      kind: AssistantShareKind.TranscriptS3;
    }
  | {
      kind: AssistantShareKind.Report;
      report: MeetingReport;
    }
  | {
      kind: AssistantShareKind.ReportS3;
    };
