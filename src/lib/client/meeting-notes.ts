import type {
  MeetingNote,
  MeetingNoteDocument,
  MeetingTodo,
  RealtimeToken,
} from "@/interfaces/meeting-note";
import { requireSuccess } from "@/lib/client/api";
import {
  getMeetingNoteApiUrl,
  getMeetingNoteDocumentApiUrl,
  getMeetingTodoApiUrl,
  getMeetingTodosApiUrl,
  REALTIME_TOKEN_API_PATH,
} from "@/lib/const";
import { httpClient } from "@/lib/http-client";

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
