import { getPublicBackendUrl } from "@/lib/const";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
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
 * plumb it through. Locally, if the public backend is unreachable, falls back
 * to the Next.js /api/documents proxy.
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

  const post = (url: string) =>
    httpClient.post<StoredDocument>(url, data, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: UPLOAD_TIMEOUT_MS,
    });

  try {
    return requireSuccess(await post(`${getPublicBackendUrl()}/api/documents`));
  } catch (error) {
    if (!(error instanceof ClientApiError) || error.code !== "NETWORK") {
      throw error;
    }
    try {
      return requireSuccess(await post("/api/documents"));
    } catch {
      throw new ClientApiError(
        "Belge sunucusuna ulaşılamadı. Canlı ortamda NEXT_PUBLIC_BACKEND_URL (CloudFront API) ve backend DOCUMENTS_ALLOWED_ORIGINS (Amplify adresi) ayarlarını kontrol edin.",
        0,
        "NETWORK",
      );
    }
  }
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
