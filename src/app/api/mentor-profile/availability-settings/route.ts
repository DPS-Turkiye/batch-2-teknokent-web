import type { NextRequest } from "next/server";

import {
  fetchMentorAvailabilitySettings,
  updateMentorAvailabilitySettings,
} from "@/lib/api/mentor-profile";
import { fetchSignedInUser } from "@/lib/api/auth";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await getSessionIds();
    return backendResponse(await fetchMentorAvailabilitySettings(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySettingsLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const idToken = readBearerToken(request);
    if (idToken) {
      // Onboarding saves availability before approval, when there is no session cookie.
      const me = await fetchSignedInUser(idToken);
      if (me.status !== 200) return backendResponse(me);
      const mentorId = (me.data as { id: string }).id;
      return backendResponse(
        await updateMentorAvailabilitySettings(mentorId, payload, idToken),
      );
    }
    const { userId } = await getSessionIds();
    return backendResponse(
      await updateMentorAvailabilitySettings(userId, payload),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySettingsUpdateFailed"),
    });
  }
}
