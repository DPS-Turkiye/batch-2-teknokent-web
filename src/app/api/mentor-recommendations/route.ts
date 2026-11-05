import type { NextRequest } from "next/server";

import { recommendMentors } from "@/lib/api/mentor-recommendations";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

const RECOMMENDATION_HEADERS = [
  "X-Matching-Method",
  "X-Matching-Model",
  "X-Recommendation-Generated-At",
] as const;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    const payload: unknown = await request.json();
    return backendResponse(
      await recommendMentors(payload, userId),
      RECOMMENDATION_HEADERS,
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorRecommendationUnavailable"),
    });
  }
}
