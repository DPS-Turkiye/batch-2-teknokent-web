import { getPublicBackendUrl } from "@/lib/const";
import { requireSuccess } from "@/lib/client/api";
import { currentIdToken } from "@/lib/firebase/auth";
import { UPLOAD_TIMEOUT_MS, httpClient } from "@/lib/http-client";

export type StoredDocument = {
  id: string;
  kind: string;
  originalFilename: string;
  sizeBytes: number;
};

/**
 * The Amplify-hosted frontend's own edge blocks any request body over ~8KB on
 * its proxy routes, so this goes straight to the backend instead of through
 * /api/documents. Always resolves a fresh Firebase token when the caller
 * doesn't already have one on hand, rather than requiring every call site to
 * plumb it through.
 */
export async function uploadDocument(
  file: File,
  kind: string,
  idToken?: string,
  meetingId?: string,
) {
  const token = idToken ?? (await currentIdToken());
  if (!token) {
    throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
  }
  const data = new FormData();
  data.set("file", file);
  data.set("kind", kind);
  if (meetingId) data.set("meetingId", meetingId);
  return requireSuccess(
    await httpClient.post<StoredDocument>(
      `${getPublicBackendUrl()}/api/documents`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: UPLOAD_TIMEOUT_MS,
      },
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
  const response = await httpClient.get<StoredDocument[]>("/api/documents", {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return response.status === 200 ? response.data : [];
}
