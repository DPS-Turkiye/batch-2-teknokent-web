import type { NextRequest } from "next/server";

import { recommendFromProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireStartupSession } from "@/lib/server/require-program-access";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await recommendFromProfileAnalysis(id, auth.session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Eşleştirme hizmetine ulaşılamıyor.",
    });
  }
}
