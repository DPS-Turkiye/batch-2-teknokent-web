import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { setMeetingHeld } from "@/lib/api/meetings";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** The backend checks the meeting is this mentor's; the mentor id only ever comes from the session. */
async function setHeld(context: RouteContext, held: boolean) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session, UserRole.Mentor)) {
      return Response.json(
        {
          code: "FORBIDDEN",
          message: await apiText("onlyMentorConfirmsMeeting"),
        },
        { status: 403 },
      );
    }
    const { id } = await context.params;
    return backendResponse(await setMeetingHeld(id, session.userId, held));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingHeldFailed"),
    });
  }
}

export function POST(_request: NextRequest, context: RouteContext) {
  return setHeld(context, true);
}

export function DELETE(_request: NextRequest, context: RouteContext) {
  return setHeld(context, false);
}
