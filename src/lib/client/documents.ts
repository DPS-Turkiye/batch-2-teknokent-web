import { requireSuccess } from "@/lib/client/api";
import { UPLOAD_TIMEOUT_MS, httpClient } from "@/lib/http-client";

export type StoredDocument = {
  id: string;
  kind: string;
  originalFilename: string;
  sizeBytes: number;
};

function bearer(idToken: string) {
  return { headers: { Authorization: `Bearer ${idToken}` } };
}

export async function uploadDocument(
  file: File,
  kind: string,
  idToken?: string,
) {
  const data = new FormData();
  data.set("file", file);
  data.set("kind", kind);
  return requireSuccess(
    await httpClient.post<StoredDocument>("/api/documents", data, {
      ...(idToken ? bearer(idToken) : {}),
      timeout: UPLOAD_TIMEOUT_MS,
    }),
  );
}
