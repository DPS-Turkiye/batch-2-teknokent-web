import type { NextRequest } from "next/server";
import { z } from "zod";

import { upsertMentorshipWeekCheck } from "@/lib/api/mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionMentorId } from "@/lib/session";

const weekCheckSchema = z.object({
  weekStart: z.string().min(1),
  completed: z.boolean(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actorId = await getSessionMentorId();
    const body = await readJsonBody(request, weekCheckSchema, {
      invalidMessage: "weekStartRequired",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await upsertMentorshipWeekCheck({
        mentorshipId: id,
        actorId,
        weekStart: body.data.weekStart,
        completed: body.data.completed,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weeklyMarkUpdateFailed"),
    });
  }
}
