import type {
  DocumentRequestItem,
  DocumentRequestScope,
  DocumentRequestUpload,
} from "@/interfaces/document-request";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

function scopeParams(scope: DocumentRequestScope) {
  return {
    mentorshipRequestId: scope.mentorshipRequestId,
    meetingId: scope.meetingId,
    mentorshipId: scope.mentorshipId,
  };
}

export async function listDocumentRequests(scope: DocumentRequestScope) {
  return requireSuccess(
    await httpClient.get<DocumentRequestItem[]>("/api/document-requests", {
      params: scopeParams(scope),
    }),
  );
}

export async function replaceDocumentRequests(
  scope: DocumentRequestScope,
  titles: string[],
) {
  return requireSuccess(
    await httpClient.put<DocumentRequestItem[]>(
      "/api/document-requests",
      {
        titles,
      },
      {
        params: scopeParams(scope),
      },
    ),
  );
}

export async function attachDocumentRequestUpload(
  itemId: string,
  storedDocumentId: string,
) {
  return requireSuccess(
    await httpClient.post<DocumentRequestUpload>(
      `/api/document-requests/${encodeURIComponent(itemId)}/uploads`,
      { storedDocumentId },
    ),
  );
}

export async function deleteDocumentRequestUpload(uploadId: string) {
  requireSuccess(
    await httpClient.delete<void>(
      `/api/document-requests/uploads/${encodeURIComponent(uploadId)}`,
    ),
  );
}
