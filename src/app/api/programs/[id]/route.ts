import type { NextRequest } from "next/server";

import { fetchProgramDetail } from "@/lib/api/programs";
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
    return backendResponse(await fetchProgramDetail(id, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Program detayı yüklenemedi.",
    });
  }
}
