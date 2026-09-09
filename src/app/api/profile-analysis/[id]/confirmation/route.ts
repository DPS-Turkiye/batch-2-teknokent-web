import type { NextRequest } from "next/server";

import { confirmProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload: unknown = await request.json();
    return backendResponse(await confirmProfileAnalysis(id, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profil kaydedilemedi.",
    });
  }
}
