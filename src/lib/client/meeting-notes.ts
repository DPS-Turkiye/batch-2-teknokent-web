import { clientText } from "@/i18n/client-texts";
import {
  AssistantShareKind,
  type MeetingAssistantShare,
  type MeetingNote,
  type MeetingNoteDocument,
  type MeetingTodo,
  type PublishAssistantSharePayload,
} from "@/interfaces/meeting-note";
import { jsonFitsAmplifyWaf } from "@/lib/amplify-safe-body";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import {
  getAssistantShareApiUrl,
  getAssistantShareReportUploadApiUrl,
  getAssistantShareTranscriptUploadApiUrl,
  getMeetingNoteApiUrl,
  getMeetingNoteDocumentApiUrl,
  getMeetingTodoApiUrl,
  getMeetingTodosApiUrl,
} from "@/lib/const";
import { publishAssistantShareBodySchema } from "@/lib/notes-schemas";
import type { MeetingReport, TranscriptLine } from "@/types/assistant";

export async function getMeetingNote(meetingId: string) {
  return requireSuccess(
    await backendHttp.get<MeetingNote>(getMeetingNoteApiUrl(meetingId)),
  );
}

export async function getMeetingNoteDocument(meetingId: string) {
  return requireSuccess(
    await backendHttp.get<MeetingNoteDocument>(
      getMeetingNoteDocumentApiUrl(meetingId),
    ),
  );
}

export async function putMeetingNote(
  meetingId: string,
  payload: { content: string },
) {
  return requireSuccess(
    await backendHttp.put<MeetingNote>(
      getMeetingNoteApiUrl(meetingId),
      payload,
    ),
  );
}

export async function getMeetingTodos(meetingId: string) {
  return requireSuccess(
    await backendHttp.get<MeetingTodo[]>(getMeetingTodosApiUrl(meetingId)),
  );
}

export async function postMeetingTodo(meetingId: string, title: string) {
  return requireSuccess(
    await backendHttp.post<MeetingTodo[]>(getMeetingTodosApiUrl(meetingId), {
      title,
    }),
  );
}

export async function patchMeetingTodo(
  meetingId: string,
  todoId: string,
  payload: { title?: string | undefined; done?: boolean | undefined },
) {
  return requireSuccess(
    await backendHttp.patch<MeetingTodo[]>(
      getMeetingTodoApiUrl(meetingId, todoId),
      payload,
    ),
  );
}

export async function removeMeetingTodo(meetingId: string, todoId: string) {
  return requireSuccess(
    await backendHttp.delete<MeetingTodo[]>(
      getMeetingTodoApiUrl(meetingId, todoId),
    ),
  );
}

export async function getAssistantShare(meetingId: string) {
  const share = requireSuccess(
    await backendHttp.get<MeetingAssistantShare>(
      getAssistantShareApiUrl(meetingId),
    ),
  );
  const transcript =
    share.transcript ??
    (await readJsonFromUrl<TranscriptLine[]>(share.transcriptUrl));
  const report =
    share.report ?? (await readJsonFromUrl<MeetingReport>(share.reportUrl));
  return { ...share, transcript, report };
}

async function readJsonFromUrl<T>(
  url: string | null | undefined,
): Promise<T | null> {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(clientText("notebookUnreadable"));
  }
  return (await response.json()) as T;
}

export async function postAssistantShare(
  meetingId: string,
  payload: PublishAssistantSharePayload,
) {
  // The lines and the report are tidied as the backend stores them: blank speakers named, empty items dropped.
  const body = publishAssistantShareBodySchema.safeParse(payload);
  if (!body.success) throw new Error(clientText("assistant.sendFailed"));
  return requireSuccess(
    await backendHttp.post<MeetingAssistantShare>(
      getAssistantShareApiUrl(meetingId),
      body.data,
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
    await backendHttp.post<TranscriptUploadUrl>(
      getAssistantShareTranscriptUploadApiUrl(meetingId),
      {},
    ),
  );
}

export async function createReportUpload(meetingId: string) {
  return requireSuccess(
    await backendHttp.post<TranscriptUploadUrl>(
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
    if (response.status === 403) {
      throw new Error(
        "S3 CORS bu origin için kapalı. Bucket'a PUT + Content-Type izni gerekir.",
      );
    }
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
  const payload = {
    kind: AssistantShareKind.Transcript as const,
    transcript: lines,
  };
  // Only a failed upload falls back to sending the transcript inline; a failed share post is the caller's error.
  try {
    const upload = await createTranscriptUpload(meetingId);
    await putTranscriptToPresignedUrl(upload, lines);
  } catch (error) {
    if (!jsonFitsAmplifyWaf(payload)) throw error;
    return postAssistantShare(meetingId, payload);
  }
  return postAssistantShare(meetingId, {
    kind: AssistantShareKind.TranscriptS3,
  });
}

export async function publishReportShare(
  meetingId: string,
  report: MeetingReport,
) {
  const payload = { kind: AssistantShareKind.Report as const, report };
  // Only a failed upload falls back to sending the report inline; a failed share post is the caller's error.
  try {
    const upload = await createReportUpload(meetingId);
    await putJsonToPresignedUrl(upload, report, "Rapor S3'e yüklenemedi.");
  } catch (error) {
    if (!jsonFitsAmplifyWaf(payload)) throw error;
    return postAssistantShare(meetingId, payload);
  }
  return postAssistantShare(meetingId, { kind: AssistantShareKind.ReportS3 });
}
