import type { NextRequest } from "next/server";

import {
  createMentorRequest,
  fetchMentorRequests,
} from "@/lib/api/mentor-requests";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const role =
      request.nextUrl.searchParams.get("role") === "mentor"
        ? "mentor"
        : "mentee";
    const requesterId =
      role === "mentor"
        ? await getSessionMentorId()
        : (await getSessionIds()).userId;
    return backendResponse(await fetchMentorRequests({ requesterId, role }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentorship request service is unavailable.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await createMentorRequest(session, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentorship request could not be created.",
    });
  }
}
