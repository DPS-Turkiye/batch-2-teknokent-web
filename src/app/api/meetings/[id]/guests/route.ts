import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { inviteMeetingGuest } from "@/lib/api/meetings";
import { hasPermission } from "@/lib/permissions";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import {
  requireOwnedMeeting,
  resolveGuestMentor,
  resolveMentorMeetingOrganization,
} from "@/lib/server/mentor-meeting";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";
import { getSessionUser } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session, UserRole.Mentor)) {
      return Response.json(
        {
          code: "FORBIDDEN",
          message: await apiText("onlyMentorAddsParticipants"),
        },
        { status: 403 },
      );
    }
    const { id } = await context.params;
    const owned = await requireOwnedMeeting(session.userId, id);
    if ("error" in owned) return owned.error;

    const body = await readJsonBody(request, jsonObjectSchema);
    if (!body.ok) return body.response;
    const payload = body.data;
    const guest: { organizationId?: string; mentorId?: string } = {};
    const mentorId =
      typeof payload.mentorId === "string" ? payload.mentorId : "";
    const organizationId =
      typeof payload.organizationId === "string" ? payload.organizationId : "";

    if (mentorId) {
      const resolved = await resolveGuestMentor(session.userId, mentorId);
      if ("error" in resolved) return resolved.error;
      guest.mentorId = resolved.guestId;
      if (organizationId) guest.organizationId = organizationId;
    } else if (organizationId) {
      const resolved = await resolveMentorMeetingOrganization(
        payload,
        session.userId,
      );
      if ("error" in resolved) return resolved.error;
      guest.organizationId = resolved.organizationId;
    }

    if (!guest.organizationId && !guest.mentorId) {
      return Response.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("participantRequired"),
        },
        { status: 400 },
      );
    }

    return backendResponse(await inviteMeetingGuest(id, guest));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("participantAddFailed"),
    });
  }
}
