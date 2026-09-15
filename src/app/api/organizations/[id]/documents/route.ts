import type { NextRequest } from "next/server";

import { fetchStartupDocuments } from "@/lib/api/startup-documents";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    return backendResponse(await fetchStartupDocuments(id, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Startup dosyaları yüklenemedi.",
    });
  }
}
