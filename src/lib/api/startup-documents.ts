import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchStartupDocuments(organizationId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/organizations/${encodeURIComponent(organizationId)}/documents`,
    params: { actorId },
  });
}

export function fetchDocumentDownloadUrl(documentId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/documents/${encodeURIComponent(documentId)}/download-url`,
    params: { actorId },
  });
}

export function shareStartupDocument(
  documentId: string,
  actorId: string,
  mentorId: string,
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: `/api/documents/${encodeURIComponent(documentId)}/shares`,
    data: { actorId, mentorId },
  });
}

export function unshareStartupDocument(
  documentId: string,
  mentorId: string,
  actorId: string,
) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: `/api/documents/${encodeURIComponent(documentId)}/shares/${encodeURIComponent(mentorId)}`,
    params: { actorId },
  });
}

export function deleteStartupDocument(documentId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: `/api/documents/${encodeURIComponent(documentId)}`,
    params: { actorId },
  });
}
