import { type NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
import { resolveMentorMeetingOrganization } from "@/lib/server/mentor-meeting";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds, getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (session?.role === UserRole.Mentor) {
      return backendResponse(await fetchMeetings({ mentorId: session.userId }));
    }
    const { organizationId } = await getSessionIds();
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
    const isMentor = session?.role === UserRole.Mentor;
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
