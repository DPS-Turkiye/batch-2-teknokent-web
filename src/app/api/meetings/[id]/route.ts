import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { deleteMeeting, updateMeeting } from "@/lib/api/meetings";
import {
  requireMeetingAccess,
  requireOwnedMeeting,
} from "@/lib/server/mentor-meeting";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await context.params;
    const access = await requireMeetingAccess(session, id);
    if ("error" in access) return access.error;
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await updateMeeting(id, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingUpdateFailed"),
    });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session, UserRole.Mentor)) {
      return Response.json(
        {
          code: "FORBIDDEN",
          message: await apiText("onlyMentorDeletesMeeting"),
        },
        { status: 403 },
      );
    }
    const { id } = await context.params;
    const owned = await requireOwnedMeeting(session.userId, id);
    if ("error" in owned) return owned.error;
    return backendResponse(await deleteMeeting(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingDeleteFailed"),
    });
  }
}
