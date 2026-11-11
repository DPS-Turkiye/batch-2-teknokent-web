import type { NextRequest } from "next/server";

import {
  fetchMeetingFeedback,
  submitMeetingFeedback,
} from "@/lib/api/meetings";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await getSessionIds();
    return backendResponse(await fetchMeetingFeedback(id, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("feedbackLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await getSessionIds();
    const body = await readJsonBody(request, jsonObjectSchema);
    if (!body.ok) return body.response;
    return backendResponse(await submitMeetingFeedback(id, userId, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("feedbackSaveFailed"),
    });
  }
}
