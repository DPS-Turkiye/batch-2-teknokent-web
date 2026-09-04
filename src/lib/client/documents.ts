import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

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
    await httpClient.post<StoredDocument>(
      "/api/documents",
      data,
      idToken ? bearer(idToken) : undefined,
    ),
  );
}

/**
 * A brand-new signup has no account yet, so the backend 401s and that means
 * "nothing stored" rather than an error worth surfacing.
 */
export async function listDocuments(
  idToken: string,
): Promise<StoredDocument[]> {
  const response = await httpClient.get<StoredDocument[]>(
    "/api/documents",
    bearer(idToken),
  );
  return response.status === 200 ? response.data : [];
}
