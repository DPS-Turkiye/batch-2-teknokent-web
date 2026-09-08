import { NextRequest } from "next/server";

import { fetchLatestProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getSessionIds();
    const appUserId =
      request.nextUrl.searchParams.get("appUserId") ?? undefined;
    return backendResponse(
      await fetchLatestProfileAnalysis(organizationId, appUserId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profile service is unavailable.",
    });
  }
}
