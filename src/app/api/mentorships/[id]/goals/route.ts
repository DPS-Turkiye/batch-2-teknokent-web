import type { NextRequest } from "next/server";
import { z } from "zod";

import { createMentorshipGoal } from "@/lib/api/mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionMentorId } from "@/lib/session";

const goalSchema = z.object({ title: z.string().trim().min(1) });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actorId = await getSessionMentorId();
    const body = await readJsonBody(request, goalSchema, {
      invalidMessage: "goalTextRequired",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await createMentorshipGoal({
        mentorshipId: id,
        actorId,
        title: body.data.title,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("goalAddFailed"),
    });
  }
}
