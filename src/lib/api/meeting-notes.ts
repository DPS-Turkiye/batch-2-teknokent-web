import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

type SessionIds = {
  userId: string;
  organizationId: string;
};

function meetingPath(meetingId: string, suffix: string) {
  return `/api/meetings/${encodeURIComponent(meetingId)}${suffix}`;
}

export function fetchMeetingNote(meetingId: string, organizationId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: meetingPath(meetingId, "/note"),
    params: { organizationId },
  });
}

export function fetchMeetingNoteDocument(
  meetingId: string,
  organizationId: string,
) {
  return backendRequest({
    method: HttpMethod.Get,
    url: meetingPath(meetingId, "/note/document"),
    params: { organizationId },
  });
}

export function saveMeetingNote(
  meetingId: string,
  session: SessionIds,
  payload: { content: string },
) {
  return backendRequest({
    method: HttpMethod.Put,
    url: meetingPath(meetingId, "/note"),
    data: { ...payload, ...session },
  });
}

export function fetchMeetingTodos(meetingId: string, organizationId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: meetingPath(meetingId, "/todos"),
    params: { organizationId },
  });
}

export function createMeetingTodo(
  meetingId: string,
  session: SessionIds,
  payload: { title: string },
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: meetingPath(meetingId, "/todos"),
    data: { ...payload, ...session },
  });
}

export function updateMeetingTodo(
  meetingId: string,
  todoId: string,
  organizationId: string,
  payload: { title?: string | undefined; done?: boolean | undefined },
) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: meetingPath(meetingId, `/todos/${encodeURIComponent(todoId)}`),
    data: { ...payload, organizationId },
  });
}

export function deleteMeetingTodo(
  meetingId: string,
  todoId: string,
  organizationId: string,
) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: meetingPath(meetingId, `/todos/${encodeURIComponent(todoId)}`),
    params: { organizationId },
  });
}

/** signedInAt (epoch ms) lets the backend close the socket when an admin ends the sign-ins after it. */
export function issueRealtimeToken(session: SessionIds, signedInAt?: number) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/realtime/token",
    data: {
      ...session,
      signedInAt:
        signedInAt === undefined
          ? undefined
          : new Date(signedInAt).toISOString(),
    },
  });
}

export function fetchAssistantShare(
  meetingId: string,
  scope: { organizationId?: string; viewerId?: string },
) {
  return backendRequest({
    method: HttpMethod.Get,
    url: meetingPath(meetingId, "/assistant-share"),
    params: {
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
      ...(scope.viewerId ? { viewerId: scope.viewerId } : {}),
    },
  });
}

export function publishAssistantShare(
  meetingId: string,
  actorId: string,
  payload: {
    kind: "TRANSCRIPT" | "TRANSCRIPT_S3" | "REPORT" | "REPORT_S3";
    transcript?: unknown;
    report?: unknown;
  },
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: meetingPath(meetingId, "/assistant-share"),
    data: { ...payload, actorId },
  });
}

export function createTranscriptUpload(meetingId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Post,
    url: meetingPath(meetingId, "/assistant-share/transcript-upload"),
    data: { actorId },
  });
}

export function createReportUpload(meetingId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Post,
    url: meetingPath(meetingId, "/assistant-share/report-upload"),
    data: { actorId },
  });
}
