import { NextResponse, type NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
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
      message: "Meeting service is unavailable.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const payload = (await request.json()) as Record<string, unknown>;
    const isMentor = session?.role === UserRole.Mentor;
    const mentorId = isMentor ? session.userId : undefined;

    // A mentor has no organization of their own, so the meeting's organization
    // is resolved from the mentorship it belongs to - server-side, so a caller
    // cannot book a meeting into somebody else's organization.
    let organizationId: string;
    if (isMentor) {
      const requestId = payload.mentorshipRequestId;
      if (typeof requestId !== "string" || !requestId) {
        return NextResponse.json(
          {
            code: "INVALID_REQUEST",
            message: "Toplantı için bir mentorluk seçilmelidir.",
          },
          { status: 400 },
        );
      }
      const mentorship = await fetchMentorRequest(requestId);
      if (mentorship.status !== 200) return backendResponse(mentorship);
      organizationId = (mentorship.data as { organizationId: string })
        .organizationId;
    } else {
      ({ organizationId } = await getSessionIds());
    }

    return backendResponse(
      await createMeeting(organizationId, payload, mentorId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting could not be created.",
    });
  }
}
