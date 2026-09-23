import type { NextRequest } from "next/server";

import { fetchSignedInUser } from "@/lib/api/auth";
import {
  fetchMentorProfile,
  updateMentorProfile,
} from "@/lib/api/mentor-profile";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";
import { readBearerToken } from "@/lib/server/bearer-token";

export async function GET() {
  try {
    const { userId } = await getSessionIds();
    return backendResponse(await fetchMentorProfile(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor profili yüklenemedi.",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    const payload = (await request.json()) as Record<string, unknown>;

    if (idToken) {
      // Onboarding runs before approval, so there is no session cookie yet.
      // Resolve the caller's own id from the token rather than trusting input.
      const me = await fetchSignedInUser(idToken);
      if (me.status !== 200) return backendResponse(me);
      const mentorId = (me.data as { id: string }).id;
      return backendResponse(
        await updateMentorProfile(mentorId, payload, idToken),
      );
    }

    const { userId } = await getSessionIds();
    return backendResponse(await updateMentorProfile(userId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor profili güncellenemedi.",
    });
  }
}
