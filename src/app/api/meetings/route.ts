import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
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
    const { organizationId } = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    const mentorId =
      session?.role === UserRole.Mentor ? session.userId : undefined;
    return backendResponse(
      await createMeeting(organizationId, payload, mentorId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting could not be created.",
    });
  }
}
