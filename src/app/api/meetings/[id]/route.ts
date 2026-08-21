import type { NextRequest } from "next/server";

import { updateMeeting } from "@/lib/api/meetings";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await updateMeeting(id, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting could not be updated.",
    });
  }
}
