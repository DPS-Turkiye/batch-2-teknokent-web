import type { NextRequest } from "next/server";
import { z } from "zod";

import { updateActiveProgram } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { requireStartupSession } from "@/lib/server/require-program-access";

const activeProgramSchema = z.object({ programId: stringOrNullSchema });

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    // A null programId is meaningful, not missing: it clears the choice and
    // returns the startup to the "no program" state.
    const body = await readJsonBody(request, activeProgramSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateActiveProgram(auth.session.userId, body.data.programId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programChoiceSaveFailed"),
    });
  }
}
