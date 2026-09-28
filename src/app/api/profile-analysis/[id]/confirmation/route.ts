import type { NextRequest } from "next/server";

import { confirmProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireStartupSession } from "@/lib/server/require-program-access";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const payload: unknown = await request.json();
    return backendResponse(
      await confirmProfileAnalysis(id, auth.session.userId, payload),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profil kaydedilemedi.",
    });
  }
}
