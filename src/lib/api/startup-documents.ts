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
