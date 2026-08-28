import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function uploadStoredDocument(options: {
  file: File;
  kind: string;
  idToken?: string;
  userId?: string;
}) {
  const data = new FormData();
  data.set("file", options.file);
  data.set("kind", options.kind);
  return backendRequest(
    {
      method: "POST",
      url: "/api/documents",
      params: options.userId ? { userId: options.userId } : undefined,
      data,
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
    { idToken: options.idToken },
  );
}
