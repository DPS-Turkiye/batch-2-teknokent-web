import { NextRequest } from "next/server";

import { fetchLatestProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

/**
 * Read-only. The upload that used to sit here now goes straight from the
 * browser to the backend, because this app's own edge blocks request bodies
 * over ~8KB; a latest-analysis lookup is small JSON, so it still proxies.
 */
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
