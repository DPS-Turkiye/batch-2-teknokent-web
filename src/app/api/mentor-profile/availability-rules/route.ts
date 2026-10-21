import type { NextRequest } from "next/server";

import {
  createMentorAvailabilityRule,
  fetchMentorAvailabilityRules,
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
    return backendResponse(await fetchMentorAvailabilityRules(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilityRulesLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await createMentorAvailabilityRule(userId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilityRuleCreateFailed"),
    });
  }
}
