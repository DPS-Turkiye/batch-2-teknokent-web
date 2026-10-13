import type { AxiosResponse } from "axios";

import { getPublicBackendUrl } from "@/lib/const";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { currentIdToken } from "@/lib/firebase/auth";
import { UPLOAD_TIMEOUT_MS, httpClient } from "@/lib/http-client";
import { clientText } from "@/i18n/client-texts";

export type StoredDocument = {
  id: string;
  kind: string;
  originalFilename: string;
  sizeBytes: number;
};

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  "The file is too large.": "Dosya boyut sınırını aşıyor.",
  "Please upload a PDF, DOCX or XLSX file.":
    "Yalnızca PDF, DOCX, XLSX veya PPTX dosyası yükleyebilirsin.",
  "Please upload a PDF.": "Yalnızca PDF dosyası yükleyebilirsin.",
  "Please upload a PNG, JPG or WebP image.":
    "Yalnızca PNG, JPG veya WebP görsel yükleyebilirsin.",
  "Please upload a PNG, JPG, or WebP image.":
    "Yalnızca PNG, JPG veya WebP görsel yükleyebilirsin.",
  "A file is required.": "Boş bir dosya yüklenemez.",
  "The uploaded file could not be read.": "Dosya okunamadı.",
  "The uploaded PDF is invalid.": "PDF dosyası bozuk görünüyor.",
  "The uploaded image is invalid.": "Görsel dosyası bozuk görünüyor.",
};

const UPLOAD_UNREACHABLE_MESSAGE =
  "Dosya sunucusuna ulaşılamadı. Bağlantını kontrol edip tekrar dene.";

/**
 * requireSuccess hides English server messages behind a generic "check the
 * fields" text, which is wrong for a refused file, so the reason is read first.
 */
function uploaded(response: AxiosResponse<StoredDocument>) {
  const body = response.data as unknown;
  const reason =
    response.status >= 400 &&
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
      ? UPLOAD_ERROR_MESSAGES[body.message.trim()]
      : undefined;
  if (reason) throw new ClientApiError(reason, response.status);
  return requireSuccess(response);
}

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
    throw new Error(clientText("sessionExpired"));
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
    return uploaded(await post(`${getPublicBackendUrl()}/api/documents`));
  } catch (error) {
    if (!(error instanceof ClientApiError) || error.code !== "NETWORK") {
      throw error;
    }
  }
  try {
    return uploaded(await post("/api/documents"));
  } catch (error) {
    if (error instanceof ClientApiError && error.code === "NETWORK") {
      throw new ClientApiError(UPLOAD_UNREACHABLE_MESSAGE, 0, "NETWORK");
    }
    throw error;
  }
}

/** The signed-in person's own files, newest first, through their session. */
export async function listOwnDocuments() {
  return requireSuccess(
    await httpClient.get<StoredDocument[]>("/api/documents"),
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
