import type { NextRequest } from "next/server";

import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchMeetings(organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting service is unavailable.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await createMeeting(organizationId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting could not be created.",
    });
  }
}
