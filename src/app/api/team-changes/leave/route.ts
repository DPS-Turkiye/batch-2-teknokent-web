import { NextResponse } from "next/server";

import { leaveTeam } from "@/lib/api/team-changes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds, refreshSessionUser } from "@/lib/session";

/** The leader leaves at once. Answers with the session, now without a startup. */
export async function POST(request: Request) {
  try {
    const { organizationId, userId } = await getSessionIds();
    const body = (await request.json()) as { successorId?: string | null };
    const response = await leaveTeam(
      organizationId,
      userId,
      body.successorId ?? null,
    );
    if (response.status !== 200) return backendResponse(response);
    return NextResponse.json(await refreshSessionUser(response.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamLeaveFailed"),
    });
  }
}
