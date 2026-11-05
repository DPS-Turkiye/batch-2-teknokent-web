import "server-only";

import type {
  PlatformFeedback,
  PlatformFeedbackInbox,
  SubmitPlatformFeedback,
} from "@/interfaces/platform-feedback";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function postPlatformFeedback(
  actorId: string,
  feedback: SubmitPlatformFeedback,
) {
  return backendRequest<PlatformFeedback>({
    method: HttpMethod.Post,
    url: "/api/platform-feedback",
    data: { ...feedback, actorId },
  });
}

export function fetchPlatformFeedbackInbox(
  actorId: string,
  page: number,
  unreadOnly: boolean,
) {
  return backendRequest<PlatformFeedbackInbox>({
    method: HttpMethod.Get,
    url: "/api/admin/platform-feedback",
    params: { actorId, page, unreadOnly },
  });
}

export function markPlatformFeedbackRead(actorId: string, id: string) {
  return backendRequest<PlatformFeedback>({
    method: HttpMethod.Patch,
    url: `/api/admin/platform-feedback/${encodeURIComponent(id)}/read`,
    params: { actorId },
  });
}
