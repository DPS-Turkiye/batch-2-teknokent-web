import { NextRequest } from "next/server";

import { updateActiveProgram } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireStartupSession } from "@/lib/server/require-program-access";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    // A null programId is meaningful, not missing: it clears the choice and
    // returns the startup to the "no program" state.
    const body = (await request.json()) as { programId?: string | null };
    return backendResponse(
      await updateActiveProgram(auth.session.userId, body.programId ?? null),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Program seçiminiz kaydedilemedi.",
    });
  }
}
