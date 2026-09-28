import type { NextRequest } from "next/server";

import { createManualProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { organizationId, userId } = await getSessionIds();
    const body = (await request.json()) as {
      appUserId?: string;
      [key: string]: unknown;
    };
    const { appUserId, ...payload } = body;
    return backendResponse(
      await createManualProfileAnalysis(
        organizationId,
        userId,
        appUserId,
        payload,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profil hizmetine ulaşılamıyor.",
    });
  }
}
