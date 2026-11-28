import type { AxiosResponse } from "axios";

import { clientText } from "@/i18n/client-texts";
import type { DocumentKind } from "@/interfaces/startup-document";
import {
  ClientApiError,
  ClientErrorCode,
  requireSuccess,
} from "@/lib/client/api";
import { backendHttp, withToken } from "@/lib/client/backend-http";
import { getPublicBackendUrl } from "@/lib/const";
import { currentIdToken } from "@/lib/firebase/auth";
import {
  httpClient,
  UPLOAD_CONNECT_MS,
  UPLOAD_RESPONSE_TIMEOUT_MS,
  UPLOAD_STALL_MS,
} from "@/lib/http-client";

/** How much of the file has gone out, from 0 to 1. */
export type UploadProgress = (sent: number) => void;

export type UploadOptions = {
  onProgress?: UploadProgress;
  /** Aborting it stops the upload (İptal); the call then fails with ClientErrorCode.Canceled. */
  signal?: AbortSignal;
};

/** The error an upload stopped by its own İptal fails with. */
export function uploadCanceledError() {
  return new ClientApiError(
    clientText("uploadCanceled"),
    0,
    ClientErrorCode.Canceled,
  );
}

export function isUploadCanceled(error: unknown) {
  return (
    error instanceof ClientApiError && error.code === ClientErrorCode.Canceled
  );
}

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
 * Uploads the form straight to the backend at `path`, with upload progress and
 * stall detection that the session-cookie client does not give. Always resolves a
 * fresh Firebase token when the caller doesn't already have one on hand,
 * rather than requiring every call site to plumb it through.
 */
export async function postUpload<T>(
  path: string,
  data: FormData,
  idToken?: string,
  { onProgress, signal }: UploadOptions = {},
): Promise<T> {
  const token = idToken ?? (await currentIdToken());
  if (!token) {
    throw new Error(clientText("sessionExpired"));
  }
  if (signal?.aborted) throw uploadCanceledError();

  // No fixed total timeout: the request is aborted only when no progress arrives for UPLOAD_STALL_MS (longer
  // before the first byte), or when the answer takes longer than UPLOAD_RESPONSE_TIMEOUT_MS once the whole
  // file is out.
  const post = async (url: string) => {
    // Only the watchdog aborts it, so an aborted signal means it gave up; `sent` says in which phase.
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    const watch = { sent: false, settled: false };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const giveUpAfter = (ms: number) => {
      clearTimeout(timer);
      if (!watch.settled) timer = setTimeout(() => controller.abort(), ms);
    };
    giveUpAfter(UPLOAD_CONNECT_MS);
    try {
      return await httpClient.post<T>(url, data, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 0,
        signal: controller.signal,
        onUploadProgress: (event) => {
          if (watch.settled) return;
          const sent = event.total
            ? Math.min(1, event.loaded / event.total)
            : (event.progress ?? 0);
          watch.sent = sent >= 1;
          onProgress?.(sent);
          giveUpAfter(
            watch.sent ? UPLOAD_RESPONSE_TIMEOUT_MS : UPLOAD_STALL_MS,
          );
        },
      });
    } catch (error) {
      if (signal?.aborted) throw uploadCanceledError();
      if (controller.signal.aborted) {
        // A file that was fully sent may already be stored, so a blind retry could store it twice.
        throw new ClientApiError(
          clientText(watch.sent ? "uploadNoAnswer" : "uploadStalled"),
          0,
          ClientErrorCode.Timeout,
        );
      }
      throw error;
    } finally {
      watch.settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
    }
  };

  try {
    return uploaded(await post(`${getPublicBackendUrl()}${path}`));
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

function documentForm(file: File, kind: DocumentKind, meetingId?: string) {
  const data = new FormData();
  data.set("file", file);
  data.set("kind", kind);
  if (meetingId) data.set("meetingId", meetingId);
  return data;
}

export async function uploadDocument(
  file: File,
  kind: DocumentKind,
  idToken?: string,
  meetingId?: string,
) {
  return postUpload<StoredDocument>(
    "/api/documents",
    documentForm(file, kind, meetingId),
    idToken,
  );
}

/**
 * As uploadDocument, with the signed-in person's own token, reporting how much of the file has gone out and
 * stoppable through `signal`.
 */
export async function uploadDocumentWithProgress(
  file: File,
  kind: DocumentKind,
  options: UploadOptions,
) {
  return postUpload<StoredDocument>(
    "/api/documents",
    documentForm(file, kind),
    undefined,
    options,
  );
}

/** The signed-in person's own files, newest first, through their session. */
export async function listOwnDocuments() {
  return requireSuccess(
    await backendHttp.get<StoredDocument[]>("/api/documents"),
  );
}

/**
 * A brand-new signup has no account yet, so the backend 401s and that means
 * "nothing stored" rather than an error worth surfacing.
 */
export async function listDocuments(
  idToken: string,
): Promise<StoredDocument[]> {
  const response = await backendHttp.get<StoredDocument[]>(
    "/api/documents",
    withToken(idToken),
  );
  return response.status === 200 ? response.data : [];
}
