import type { NextRequest } from "next/server";
import { z } from "zod";

import { createManualProfileAnalysis } from "@/lib/api/profile-analysis";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { forbiddenWithoutOrganization } from "@/lib/server/without-organization";
import { getSessionIds } from "@/lib/session";

// Everything besides the member it is for goes to the analysis as it came.
const manualAnalysisSchema = z.looseObject({
  appUserId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getSessionIds();
    if (!organizationId) return forbiddenWithoutOrganization();
    const body = await readJsonBody(request, manualAnalysisSchema);
    if (!body.ok) return body.response;
    const { appUserId, ...payload } = body.data;
    return backendResponse(
      await createManualProfileAnalysis(organizationId, appUserId, payload),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("profileServiceUnavailable"),
    });
  }
}
