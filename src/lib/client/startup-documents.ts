import type { DocumentRequestItem } from "@/interfaces/document-request";
import type {
  DocumentDownload,
  StartupDocument,
} from "@/interfaces/startup-document";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { ownOrganizationPath } from "@/lib/client/own-organization";

/** The signed-in person's own startup's files. */
export async function getStartupDocuments() {
  return requireSuccess(
    await backendHttp.get<StartupDocument[]>(
      await ownOrganizationPath("/documents"),
    ),
  );
}

/** Another startup's files, for its mentors and staff. */
export async function getOrganizationDocuments(organizationId: string) {
  return requireSuccess(
    await backendHttp.get<StartupDocument[]>(
      `/api/organizations/${encodeURIComponent(organizationId)}/documents`,
    ),
  );
}

export async function getStartupDocumentRequests() {
  return requireSuccess(
    await backendHttp.get<DocumentRequestItem[]>(
      await ownOrganizationPath("/document-requests"),
    ),
  );
}

function documentPath(documentId: string) {
  return `/api/documents/${encodeURIComponent(documentId)}`;
}

/** A short-lived link the browser opens or reads itself. */
export async function getDocumentDownloadUrl(documentId: string) {
  return requireSuccess(
    await backendHttp.get<DocumentDownload>(
      `${documentPath(documentId)}/download-url`,
    ),
  );
}

export async function shareDocument(documentId: string, mentorId: string) {
  return requireSuccess(
    await backendHttp.post<StartupDocument>(
      `${documentPath(documentId)}/shares`,
      { mentorId },
    ),
  );
}

export async function unshareDocument(documentId: string, mentorId: string) {
  return requireSuccess(
    await backendHttp.delete<StartupDocument>(
      `${documentPath(documentId)}/shares/${encodeURIComponent(mentorId)}`,
    ),
  );
}

export async function deleteDocument(documentId: string) {
  requireSuccess(await backendHttp.delete<void>(documentPath(documentId)));
}
