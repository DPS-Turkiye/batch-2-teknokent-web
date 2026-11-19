import type { NextRequest } from "next/server";

import { setProgramWeekVisibility } from "@/lib/api/program-weeks";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import {
  readPlanWeek,
  weekVisibilitySchema,
} from "@/lib/server/program-week-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Context = { params: Promise<{ id: string; week: string }> };

/** The backend allows only the program's own coordinators, as for saving the plan. */
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, week: segment } = await params;
    const week = await readPlanWeek(segment);
    if (!week.ok) return week.response;
    const body = await readJsonBody(request, weekVisibilitySchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await setProgramWeekVisibility(
        auth.session.userId,
        id,
        week.data,
        body.data.visibility,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weekVisibilitySaveFailed"),
    });
  }
}
