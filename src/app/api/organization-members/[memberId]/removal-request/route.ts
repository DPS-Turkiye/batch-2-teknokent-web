import type { NextRequest } from "next/server";

import { requestRemoval } from "@/lib/api/team-changes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type Context = { params: Promise<{ memberId: string }> };

/** The leader asks the coordinator to remove a member. */
export async function POST(_request: NextRequest, { params }: Context) {
  try {
    const { memberId } = await params;
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(
      await requestRemoval(organizationId, memberId, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamRemovalRequestFailed"),
    });
  }
}
