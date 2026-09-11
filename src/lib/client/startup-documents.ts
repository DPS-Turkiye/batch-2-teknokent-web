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

export async function getDocumentDownloadUrl(documentId: string) {
  return requireSuccess(
    await httpClient.get<DocumentDownload>(
      `/api/startup/documents/${encodeURIComponent(documentId)}/download-url`,
    ),
  );
}
