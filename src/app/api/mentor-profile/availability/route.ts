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
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await createMentorAvailabilitySlot(userId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySlotCreateFailed"),
    });
  }
}
