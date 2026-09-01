import type { NextRequest } from "next/server";

import { fetchSignedInUser } from "@/lib/api/auth";
import {
  fetchMentorProfile,
  updateMentorProfile,
} from "@/lib/api/mentor-profile";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

const BEARER_PREFIX = "Bearer ";

function readIdToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length).trim() || null;
}

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
    const idToken = readIdToken(request);
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
      message: "Mentor profile could not be updated.",
    });
  }
}
