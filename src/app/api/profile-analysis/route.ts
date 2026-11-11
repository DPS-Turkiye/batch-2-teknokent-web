import type { NextRequest } from "next/server";

import { fetchLatestProfileAnalysis } from "@/lib/api/profile-analysis";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { forbiddenWithoutOrganization } from "@/lib/server/without-organization";
import { getSessionIds } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getSessionIds();
    if (!organizationId) return forbiddenWithoutOrganization();
    const appUserId =
      request.nextUrl.searchParams.get("appUserId") ?? undefined;
    return backendResponse(
      await fetchLatestProfileAnalysis(organizationId, appUserId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("profileServiceUnavailable"),
    });
  }
}
