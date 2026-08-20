import type { NextRequest } from "next/server";

import { deleteMentorAvailability } from "@/lib/api/mentors";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

type RouteContext = {
  params: Promise<{ id: string; slotId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id, slotId } = await context.params;
    return backendResponse(await deleteMentorAvailability(id, slotId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Availability slot could not be removed.",
    });
  }
}
