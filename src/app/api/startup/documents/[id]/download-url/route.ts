import type { NextRequest } from "next/server";

import { fetchDocumentDownloadUrl } from "@/lib/api/startup-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId } = await getSessionIds();
    return backendResponse(await fetchDocumentDownloadUrl(id, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("fileOpenFailed"),
    });
  }
}
