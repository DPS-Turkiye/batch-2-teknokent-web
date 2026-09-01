import type { NextRequest } from "next/server";

import { submitMeetingFeedback } from "@/lib/api/meetings";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    // The author is taken from the session, never from the request body, so a
    // caller cannot leave feedback in somebody else's name.
    const { userId } = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await submitMeetingFeedback(id, userId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Değerlendirme kaydedilemedi.",
    });
  }
}
