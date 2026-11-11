import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  fetchProgramWeekPlan,
  replaceProgramWeekPlan,
} from "@/lib/api/program-weeks";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

/** Each line is trimmed and blank ones are dropped. */
const linesSchema = z
  .array(z.string())
  .transform((lines) =>
    lines.map((line) => line.trim()).filter((line) => line !== ""),
  );

const weekPlanSchema = z.object({
  weeks: z.array(
    z.object({
      week: z.number(),
      title: z.string(),
      topics: linesSchema,
      activities: linesSchema,
      deliverables: linesSchema,
      // Round-tripped from the GET; an AI week without the flag was saved as not inferred before.
      inferred: z
        .boolean()
        .nullish()
        .transform((inferred) => inferred ?? false),
    }),
  ),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchProgramWeekPlan(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weekPlanLoadFailed"),
    });
  }
}

/** The whole plan is replaced; the backend checks week numbers against the program's length. */
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, weekPlanSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await replaceProgramWeekPlan(auth.session.userId, id, body.data.weeks),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weekPlanSaveFailed"),
    });
  }
}
