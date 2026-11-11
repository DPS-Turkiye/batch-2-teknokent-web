import { NextResponse } from "next/server";
import { z } from "zod";

import { UserRole } from "@/interfaces/session";
import { joinStartup } from "@/lib/api/organization";
import { hasPermission } from "@/lib/permissions";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser, refreshSessionUser } from "@/lib/session";

const joinSchema = z.object({ inviteCode: z.string() });

/** "Kodum var" on /startup. Answers with the session, now carrying the startup. */
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session, UserRole.Mentee))
      throw new SessionRequiredError();
    const body = await readJsonBody(request, joinSchema);
    if (!body.ok) return body.response;
    const response = await joinStartup(session.userId, body.data.inviteCode);
    if (response.status !== 200) return backendResponse(response);
    return NextResponse.json(await refreshSessionUser(response.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupJoinFailed"),
    });
  }
}
