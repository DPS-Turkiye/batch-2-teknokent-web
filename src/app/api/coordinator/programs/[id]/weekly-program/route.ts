import type { NextRequest } from "next/server";

import { saveWeeklyProgram } from "@/lib/api/weekly-program";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { weeklyProgramSaveSchema } from "@/lib/server/program-week-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Context = { params: Promise<{ id: string }> };

/** Saves the reviewed weeks, their phases and the file in one step. */
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, weeklyProgramSaveSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await saveWeeklyProgram(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weeklyProgramSaveFailed"),
    });
  }
}
