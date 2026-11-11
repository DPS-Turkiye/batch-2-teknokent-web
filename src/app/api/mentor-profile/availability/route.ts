import type { NextRequest } from "next/server";

import {
  createMentorAvailabilitySlot,
  fetchMentorAvailability,
} from "@/lib/api/mentor-profile";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await getSessionIds();
    return backendResponse(await fetchMentorAvailability(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilityLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    const body = await readJsonBody(request, jsonObjectSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createMentorAvailabilitySlot(userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySlotCreateFailed"),
    });
  }
}
