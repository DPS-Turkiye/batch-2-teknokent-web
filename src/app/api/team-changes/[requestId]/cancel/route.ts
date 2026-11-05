import type { NextRequest } from "next/server";

import { cancelTeamChange } from "@/lib/api/team-changes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type Context = { params: Promise<{ requestId: string }> };

export async function POST(_request: NextRequest, { params }: Context) {
  try {
    const { requestId } = await params;
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(
      await cancelTeamChange(organizationId, requestId, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamChangeCancelFailed"),
    });
  }
}
