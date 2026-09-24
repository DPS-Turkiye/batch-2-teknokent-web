import type { NextRequest } from "next/server";

import { fetchCoordinatorOverview } from "@/lib/api/coordinator-overview";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const programId = request.nextUrl.searchParams.get("programId");
    return backendResponse(
      await fetchCoordinatorOverview(auth.session.userId, programId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Anasayfa yüklenemedi.",
    });
  }
}
