import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchDocumentRequests(params: {
  mentorshipRequestId?: string;
  meetingId?: string;
  mentorshipId?: string;
}) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/document-requests",
    params,
  });
}

export function replaceDocumentRequests(
  params: {
    mentorshipRequestId?: string;
    meetingId?: string;
    mentorshipId?: string;
  },
  data: { actorId: string; titles: string[] },
) {
  return backendRequest({
    method: HttpMethod.Put,
    url: "/api/document-requests",
    params,
    data,
  });
}

export function attachDocumentRequestUpload(
  itemId: string,
  data: { actorId: string; storedDocumentId: string },
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: `/api/document-requests/${encodeURIComponent(itemId)}/uploads`,
    data,
  });
}

export function deleteDocumentRequestUpload(uploadId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: `/api/document-requests/uploads/${encodeURIComponent(uploadId)}`,
    params: { actorId },
  });
}
