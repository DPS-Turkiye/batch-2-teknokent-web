import type { NextRequest } from "next/server";

import {
  fetchProgramWeekPlan,
  replaceProgramWeekPlan,
} from "@/lib/api/program-weeks";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { weekPlanSchema } from "@/lib/server/program-week-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

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
