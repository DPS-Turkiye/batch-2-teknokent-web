import type {
  MeetingAssistantShare,
  MeetingNote,
  MeetingNoteDocument,
  MeetingTodo,
  PublishAssistantSharePayload,
  RealtimeToken,
} from "@/interfaces/meeting-note";
import { requireSuccess } from "@/lib/client/api";
import {
  getAssistantShareApiUrl,
  getAssistantShareReportUploadApiUrl,
  getAssistantShareTranscriptUploadApiUrl,
  getMeetingNoteApiUrl,
  getMeetingNoteDocumentApiUrl,
  getMeetingTodoApiUrl,
  getMeetingTodosApiUrl,
  REALTIME_TOKEN_API_PATH,
} from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import { jsonFitsAmplifyWaf } from "@/lib/amplify-safe-body";
import type { MeetingReport, TranscriptLine } from "@/types/assistant";

export async function getMeetingNote(meetingId: string) {
  return requireSuccess(
    await httpClient.get<MeetingNote>(getMeetingNoteApiUrl(meetingId)),
  );
}

export async function getMeetingNoteDocument(meetingId: string) {
  return requireSuccess(
    await httpClient.get<MeetingNoteDocument>(
      getMeetingNoteDocumentApiUrl(meetingId),
    ),
  );
}

export async function putMeetingNote(
  meetingId: string,
  payload: { content: string },
) {
  return requireSuccess(
    await httpClient.put<MeetingNote>(getMeetingNoteApiUrl(meetingId), payload),
  );
}

export async function getMeetingTodos(meetingId: string) {
  return requireSuccess(
    await httpClient.get<MeetingTodo[]>(getMeetingTodosApiUrl(meetingId)),
  );
}

export async function postMeetingTodo(meetingId: string, title: string) {
  return requireSuccess(
    await httpClient.post<MeetingTodo[]>(getMeetingTodosApiUrl(meetingId), {
      title,
    }),
  );
}

export async function patchMeetingTodo(
  meetingId: string,
  todoId: string,
  payload: { title?: string; done?: boolean },
) {
  return requireSuccess(
    await httpClient.patch<MeetingTodo[]>(
      getMeetingTodoApiUrl(meetingId, todoId),
      payload,
    ),
  );
}

export async function removeMeetingTodo(meetingId: string, todoId: string) {
  return requireSuccess(
    await httpClient.delete<MeetingTodo[]>(
      getMeetingTodoApiUrl(meetingId, todoId),
    ),
  );
}

export async function postRealtimeToken() {
  return requireSuccess(
    await httpClient.post<RealtimeToken>(REALTIME_TOKEN_API_PATH),
  );
}

export async function getAssistantShare(meetingId: string) {
  return requireSuccess(
    await httpClient.get<MeetingAssistantShare>(
      getAssistantShareApiUrl(meetingId),
    ),
  );
}

export async function postAssistantShare(
  meetingId: string,
  payload: PublishAssistantSharePayload,
) {
  return requireSuccess(
    await httpClient.post<MeetingAssistantShare>(
      getAssistantShareApiUrl(meetingId),
      payload,
    ),
  );
}

export type TranscriptUploadUrl = {
  url: string;
  method: string;
  key: string;
  contentType: string;
};

export async function createTranscriptUpload(meetingId: string) {
  return requireSuccess(
    await httpClient.post<TranscriptUploadUrl>(
      getAssistantShareTranscriptUploadApiUrl(meetingId),
      {},
    ),
  );
}

export async function createReportUpload(meetingId: string) {
  return requireSuccess(
    await httpClient.post<TranscriptUploadUrl>(
      getAssistantShareReportUploadApiUrl(meetingId),
      {},
    ),
  );
}

export async function putJsonToPresignedUrl(
  upload: TranscriptUploadUrl,
  body: unknown,
  errorMessage: string,
) {
  const response = await fetch(upload.url, {
    method: upload.method || "PUT",
    headers: {
      "Content-Type": upload.contentType || "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(errorMessage);
  }
}

export async function putTranscriptToPresignedUrl(
  upload: TranscriptUploadUrl,
  lines: TranscriptLine[],
) {
  await putJsonToPresignedUrl(upload, lines, "Transkript S3'e yüklenemedi.");
}

export async function publishTranscriptShare(
  meetingId: string,
  lines: TranscriptLine[],
) {
  const payload = { kind: "TRANSCRIPT" as const, transcript: lines };
  if (jsonFitsAmplifyWaf(payload)) {
    return postAssistantShare(meetingId, payload);
  }
  const upload = await createTranscriptUpload(meetingId);
  await putTranscriptToPresignedUrl(upload, lines);
  return postAssistantShare(meetingId, { kind: "TRANSCRIPT_S3" });
}

export async function publishReportShare(
  meetingId: string,
  report: MeetingReport,
) {
  const payload = { kind: "REPORT" as const, report };
  if (jsonFitsAmplifyWaf(payload)) {
    return postAssistantShare(meetingId, payload);
  }
  const upload = await createReportUpload(meetingId);
  await putJsonToPresignedUrl(upload, report, "Rapor S3'e yüklenemedi.");
  return postAssistantShare(meetingId, { kind: "REPORT_S3" });
}
