import { getPublicBackendUrl } from "@/lib/const";
import { requireSuccess } from "@/lib/client/api";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";

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
) {
  const token = idToken ?? (await currentIdToken());
  if (!token) {
    throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
  }
  const data = new FormData();
  data.set("file", file);
  data.set("kind", kind);
  return requireSuccess(
    await httpClient.post<StoredDocument>(
      `${getPublicBackendUrl()}/api/documents`,
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    ),
  );
}
