import type { AxiosResponse } from "axios";

import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { attachmentFilename } from "@/lib/content-disposition";

/**
 * A refused download still answers JSON, but asked for as a blob it arrives as one; read it back so
 * requireSuccess can show the backend's reason.
 */
async function withReadableFailure(
  response: AxiosResponse<Blob>,
): Promise<AxiosResponse<unknown>> {
  if (
    (response.status >= 200 && response.status < 300) ||
    !(response.data instanceof Blob)
  ) {
    return response;
  }
  try {
    return { ...response, data: JSON.parse(await response.data.text()) };
  } catch {
    return { ...response, data: null };
  }
}

/** Hands a file to the browser to save under `filename`. */
export function saveFile(file: Blob, filename: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Fetches a file the backend sends as an attachment and saves it. The backend's own name wins when its
 * Content-Disposition header is readable; `fallbackName` is the same name built here.
 */
export async function downloadBackendFile(
  url: string,
  params: Record<string, string>,
  fallbackName: string,
) {
  const response = await backendHttp.get<Blob>(url, {
    params,
    responseType: "blob",
  });
  // Throws the backend's reason for a refusal; on success the body is the file.
  requireSuccess(await withReadableFailure(response));
  saveFile(
    response.data,
    attachmentFilename(response.headers["content-disposition"]) ??
      fallbackName,
  );
}
