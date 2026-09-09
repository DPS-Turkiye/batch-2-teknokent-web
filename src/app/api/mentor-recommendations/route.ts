import type { NextRequest } from "next/server";

import { recommendMentors } from "@/lib/api/mentor-recommendations";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

const RECOMMENDATION_HEADERS = [
  "X-Matching-Method",
  "X-Matching-Model",
  "X-Recommendation-Generated-At",
] as const;

export async function POST(request: NextRequest) {
  try {
    const payload: unknown = await request.json();
    return backendResponse(
      await recommendMentors(payload),
      RECOMMENDATION_HEADERS,
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor öneri hizmetine ulaşılamıyor.",
    });
  }
}
