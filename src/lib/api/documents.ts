import "server-only";

import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import { backendRequest } from "@/lib/server/backend-client";

export function listStoredDocuments(options: {
  idToken?: string;
  userId?: string;
}) {
  return backendRequest(
    {
      method: "GET",
      url: "/api/documents",
      params: options.userId ? { userId: options.userId } : undefined,
    },
    { idToken: options.idToken },
  );
}

export function uploadStoredDocument(options: {
  formData: FormData;
  idToken: string;
}) {
  return backendRequest(
    {
      method: "POST",
      url: "/api/documents",
      data: options.formData,
      timeout: UPLOAD_TIMEOUT_MS,
    },
    { idToken: options.idToken },
  );
}
