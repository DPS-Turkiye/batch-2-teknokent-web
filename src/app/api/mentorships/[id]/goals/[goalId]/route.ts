import type { NextRequest } from "next/server";

import { updateMentorshipGoal } from "@/lib/api/mentorships";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionMentorId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string; goalId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, goalId } = await context.params;
    const actorId = await getSessionMentorId();
    const body = (await request.json()) as { done?: boolean };
    return backendResponse(
      await updateMentorshipGoal({
        mentorshipId: id,
        goalId,
        actorId,
        done: Boolean(body.done),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Hedef güncellenemedi.",
    });
  }
}
