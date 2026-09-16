import type { DocumentRequestItem } from "@/interfaces/document-request";
import type {
  DocumentDownload,
  StartupDocument,
} from "@/interfaces/startup-document";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getStartupDocuments() {
  return requireSuccess(
    await httpClient.get<StartupDocument[]>("/api/startup/documents"),
  );
}

export async function getOrganizationDocuments(organizationId: string) {
  return requireSuccess(
    await httpClient.get<StartupDocument[]>(
      `/api/organizations/${encodeURIComponent(organizationId)}/documents`,
    ),
  );
}

export async function getStartupDocumentRequests() {
  return requireSuccess(
    await httpClient.get<DocumentRequestItem[]>(
      "/api/startup/document-requests",
    ),
  );
}

export async function getDocumentDownloadUrl(documentId: string) {
  return requireSuccess(
    await httpClient.get<DocumentDownload>(
      `/api/startup/documents/${encodeURIComponent(documentId)}/download-url`,
    ),
  );
}

function documentUrl(documentId: string) {
  return `/api/startup/documents/${encodeURIComponent(documentId)}`;
}

export async function shareDocument(documentId: string, mentorId: string) {
  return requireSuccess(
    await httpClient.post<StartupDocument>(
      `${documentUrl(documentId)}/shares`,
      { mentorId },
    ),
  );
}

export async function unshareDocument(documentId: string, mentorId: string) {
  return requireSuccess(
    await httpClient.delete<StartupDocument>(
      `${documentUrl(documentId)}/shares/${encodeURIComponent(mentorId)}`,
    ),
  );
}

export async function deleteDocument(documentId: string) {
  return requireSuccess(await httpClient.delete(documentUrl(documentId)));
}
