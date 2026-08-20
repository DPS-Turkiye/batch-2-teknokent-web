import { NextResponse, type NextRequest } from "next/server";

import { deleteMentorAvailability } from "@/lib/api/mentors";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionMentorId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string; slotId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id, slotId } = await context.params;
    if (id !== (await getSessionMentorId())) {
      return NextResponse.json(
        {
          code: "FORBIDDEN",
          message: "You can only manage your own availability.",
        },
        { status: 403 },
      );
    }
    return backendResponse(await deleteMentorAvailability(id, slotId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Availability slot could not be removed.",
    });
  }
}
