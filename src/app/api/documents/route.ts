import { NextRequest } from "next/server";

import { listStoredDocuments } from "@/lib/api/documents";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

const BEARER_PREFIX = "Bearer ";

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length).trim()
    : null;
}

/**
 * Read-only. The upload that used to sit beside this now goes straight from the
 * browser to the backend, because this app's own edge blocks request bodies over
 * ~8KB. Listing is small JSON, so it still proxies — and a brand-new signup has
 * no session cookie yet, hence the bearer path alongside it.
 */
export async function GET(request: NextRequest) {
  try {
    const idToken = bearerToken(request);
    if (idToken) {
      return backendResponse(await listStoredDocuments({ idToken }));
    }

    const { userId } = await getSessionIds();
    return backendResponse(await listStoredDocuments({ userId }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Belgeler yüklenemedi.",
    });
  }
}
