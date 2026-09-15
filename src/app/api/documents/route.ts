import { NextRequest } from "next/server";

import { listStoredDocuments, uploadStoredDocument } from "@/lib/api/documents";
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
 * Read-only list still proxies. Upload prefers a direct browser→backend call
 * (Amplify body limits); this POST is the local/network fallback.
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

export async function POST(request: NextRequest) {
  try {
    const idToken = bearerToken(request);
    if (!idToken) {
      return Response.json(
        { code: "UNAUTHORIZED", message: "Oturum gerekli." },
        { status: 401 },
      );
    }
    const formData = await request.formData();
    return backendResponse(await uploadStoredDocument({ formData, idToken }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Belge yüklenemedi.",
    });
  }
}
