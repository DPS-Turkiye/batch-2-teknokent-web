import { NextRequest } from "next/server";

import { fetchLatestProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { organizationId, userId } = await getSessionIds();
    const appUserId =
      request.nextUrl.searchParams.get("appUserId") ?? undefined;
    return backendResponse(
      await fetchLatestProfileAnalysis(organizationId, userId, appUserId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profil hizmetine ulaşılamıyor.",
    });
  }
}
