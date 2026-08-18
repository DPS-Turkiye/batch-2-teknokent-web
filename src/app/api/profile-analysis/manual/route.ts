import type { NextRequest } from "next/server";

import { createManualProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getSessionIds();
    const payload: unknown = await request.json();
    return backendResponse(
      await createManualProfileAnalysis(organizationId, payload),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profile service is unavailable.",
    });
  }
}
