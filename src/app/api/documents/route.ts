import { NextRequest } from "next/server";

import { listStoredDocuments, uploadStoredDocument } from "@/lib/api/documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";
import { readBearerToken } from "@/lib/server/bearer-token";

/**
 * Read-only list still proxies. Upload prefers a direct browser→backend call
 * (Amplify body limits); this POST is the local/network fallback.
 */
export async function GET(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    if (idToken) {
      return backendResponse(await listStoredDocuments({ idToken }));
    }

    const { userId } = await getSessionIds();
    return backendResponse(await listStoredDocuments({ userId }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentsLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    if (!idToken) {
      return Response.json(
        { code: "UNAUTHORIZED", message: await apiText("sessionRequired") },
        { status: 401 },
      );
    }
    const formData = await request.formData();
    return backendResponse(await uploadStoredDocument({ formData, idToken }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentLoadFailed"),
    });
  }
}
