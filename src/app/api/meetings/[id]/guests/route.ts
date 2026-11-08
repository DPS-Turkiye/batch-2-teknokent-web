import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { inviteMeetingGuest } from "@/lib/api/meetings";
import {
  requireOwnedMeeting,
  resolveGuestMentor,
  resolveMentorMeetingOrganization,
} from "@/lib/server/mentor-meeting";
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

    const payload = (await request.json()) as Record<string, unknown>;
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
