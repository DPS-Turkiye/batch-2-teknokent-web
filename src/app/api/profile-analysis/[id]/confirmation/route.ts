import type { NextRequest } from "next/server";

import { confirmProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSessionIds();
    const { id } = await params;
    const payload: unknown = await request.json();
    return backendResponse(await confirmProfileAnalysis(id, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profil kaydedilemedi.",
    });
  }
}
