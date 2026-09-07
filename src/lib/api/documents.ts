import "server-only";

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
