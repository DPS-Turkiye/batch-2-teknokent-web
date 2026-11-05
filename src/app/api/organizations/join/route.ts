import { NextResponse } from "next/server";

import { UserRole } from "@/interfaces/session";
import { joinStartup } from "@/lib/api/organization";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser, refreshSessionUser } from "@/lib/session";

/** "Kodum var" on /startup. Answers with the session, now carrying the startup. */
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (session?.role !== UserRole.Mentee) throw new SessionRequiredError();
    const body = await request.json();
    const response = await joinStartup(
      session.userId,
      String(body.inviteCode ?? ""),
    );
    if (response.status !== 200) return backendResponse(response);
    return NextResponse.json(await refreshSessionUser(response.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupJoinFailed"),
    });
  }
}
