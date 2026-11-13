import type { AxiosResponse } from "axios";

import { clientText } from "@/i18n/client-texts";
import type { DocumentKind } from "@/interfaces/startup-document";
import {
  ClientApiError,
  ClientErrorCode,
  requireSuccess,
} from "@/lib/client/api";
import { getPublicBackendUrl } from "@/lib/const";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient, UPLOAD_TIMEOUT_MS } from "@/lib/http-client";

export type StoredDocument = {
  id: string;
  kind: DocumentKind;
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
function uploaded<T>(response: AxiosResponse<T>) {
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
 * its proxy routes, so an upload goes straight to the backend at `path`
 * instead of through this app's route of the same path. Always resolves a
 * fresh Firebase token when the caller doesn't already have one on hand,
 * rather than requiring every call site to plumb it through. Locally, if the
 * public backend is unreachable, falls back to the Next.js proxy.
 */
export async function postUpload<T>(
  path: string,
  data: FormData,
  idToken?: string,
): Promise<T> {
  const token = idToken ?? (await currentIdToken());
  if (!token) {
    throw new Error(clientText("sessionExpired"));
  }

  const post = (url: string) =>
    httpClient.post<T>(url, data, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: UPLOAD_TIMEOUT_MS,
    });

  try {
    return uploaded(await post(`${getPublicBackendUrl()}${path}`));
  } catch (error) {
    if (
      !(error instanceof ClientApiError) ||
      error.code !== ClientErrorCode.Network
    ) {
      throw error;
    }
  }
  try {
    return uploaded(await post(path));
  } catch (error) {
    if (
      error instanceof ClientApiError &&
      error.code === ClientErrorCode.Network
    ) {
      throw new ClientApiError(
        UPLOAD_UNREACHABLE_MESSAGE,
        0,
        ClientErrorCode.Network,
      );
    }
    throw error;
  }
}

export async function uploadDocument(
  file: File,
  kind: DocumentKind,
  idToken?: string,
  meetingId?: string,
) {
  const data = new FormData();
  data.set("file", file);
  data.set("kind", kind);
  if (meetingId) data.set("meetingId", meetingId);
  return postUpload<StoredDocument>("/api/documents", data, idToken);
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
