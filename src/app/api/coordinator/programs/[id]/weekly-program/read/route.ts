import type { NextRequest } from "next/server";

import { readWeeklyProgram } from "@/lib/api/weekly-program";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { weeklyProgramReadSchema } from "@/lib/server/program-week-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Context = { params: Promise<{ id: string }> };

/** Reads an uploaded weekly program PDF for review; the backend saves nothing. */
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, weeklyProgramReadSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await readWeeklyProgram(auth.session.userId, id, body.data.documentId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weeklyProgramReadFailed"),
    });
  }
}
