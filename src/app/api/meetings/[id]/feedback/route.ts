import type { NextRequest } from "next/server";

import {
  fetchMeetingFeedback,
  submitMeetingFeedback,
} from "@/lib/api/meetings";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
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
      message: "Değerlendirme yüklenemedi.",
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await submitMeetingFeedback(id, userId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Değerlendirme kaydedilemedi.",
    });
  }
}
