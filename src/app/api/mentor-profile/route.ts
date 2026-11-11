import type { NextRequest } from "next/server";

import { fetchSignedInUser } from "@/lib/api/auth";
import {
  fetchMentorProfile,
  updateMentorProfile,
} from "@/lib/api/mentor-profile";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await getSessionIds();
    return backendResponse(await fetchMentorProfile(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorProfileLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    const body = await readJsonBody(request, jsonObjectSchema);
    if (!body.ok) return body.response;
    const payload = body.data;

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
      message: await apiText("mentorProfileUpdateFailed"),
    });
  }
}
