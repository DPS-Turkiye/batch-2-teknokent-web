import { NextResponse } from "next/server";
import { z } from "zod";

import { leaveTeam } from "@/lib/api/team-changes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { getSessionIds, refreshSessionUser } from "@/lib/session";

const leaveSchema = z.object({ successorId: stringOrNullSchema });

/** The leader leaves at once. Answers with the session, now without a startup. */
export async function POST(request: Request) {
  try {
    const { organizationId, userId } = await getSessionIds();
    const body = await readJsonBody(request, leaveSchema);
    if (!body.ok) return body.response;
    const response = await leaveTeam(
      organizationId,
      userId,
      body.data.successorId,
    );
    if (response.status !== 200) return backendResponse(response);
    return NextResponse.json(await refreshSessionUser(response.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamLeaveFailed"),
    });
  }
}
