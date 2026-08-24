import type { NextRequest } from "next/server";

import {
  fetchMentorProfile,
  updateMentorProfile,
} from "@/lib/api/mentor-profile";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await getSessionIds();
    return backendResponse(await fetchMentorProfile(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor profile could not be loaded.",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await updateMentorProfile(userId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor profile could not be updated.",
    });
  }
}
