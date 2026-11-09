import { type NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
import { resolveMentorMeetingOrganization } from "@/lib/server/mentor-meeting";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SIDE_PARAM, sessionSide } from "@/lib/server/session-side";
import { getSessionIds, getSessionUser } from "@/lib/session";
import { emptyListWithoutOrganization } from "@/lib/server/without-organization";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const side = session
      ? sessionSide(session, request.nextUrl.searchParams.get(SIDE_PARAM))
      : null;
    if (session && side === UserRole.Mentor) {
      return backendResponse(await fetchMeetings({ mentorId: session.userId }));
    }
    const { organizationId } = await getSessionIds();
    if (!organizationId) return emptyListWithoutOrganization();
    return backendResponse(await fetchMeetings({ organizationId }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingServiceUnavailable"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const payload = (await request.json()) as Record<string, unknown>;
    const isMentor =
      session != null &&
      sessionSide(session, request.nextUrl.searchParams.get(SIDE_PARAM)) ===
        UserRole.Mentor;
    const mentorId = isMentor ? session.userId : undefined;

    let organizationId: string;
    let otherMentorIds: string[] = [];
    if (isMentor) {
      const resolved = await resolveMentorMeetingOrganization(
        payload,
        session.userId,
      );
      if ("error" in resolved) return resolved.error;
      organizationId = resolved.organizationId;
      otherMentorIds = resolved.otherMentorIds;
    } else {
      ({ organizationId } = await getSessionIds());
    }

    const created = await createMeeting(organizationId, payload, mentorId);
    for (const otherMentorId of otherMentorIds) {
      await createMeeting(organizationId, payload, otherMentorId);
    }
    return backendResponse(created);
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingCreateFailed"),
    });
  }
}
