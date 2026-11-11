import type { NextRequest } from "next/server";
import { z } from "zod";

import { updateMentorshipGoal } from "@/lib/api/mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionMentorId } from "@/lib/session";

const goalSchema = z.object({ done: z.boolean() });

type RouteContext = {
  params: Promise<{ id: string; goalId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, goalId } = await context.params;
    const actorId = await getSessionMentorId();
    const body = await readJsonBody(request, goalSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateMentorshipGoal({
        mentorshipId: id,
        goalId,
        actorId,
        done: body.data.done,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("goalUpdateFailed"),
    });
  }
}
