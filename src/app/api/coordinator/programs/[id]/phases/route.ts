import { z } from "zod";

import { replaceCoordinatorProgramPhases } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { programPhaseSchema } from "@/lib/server/coordinator-program-schemas";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const replacePhasesSchema = z.object({
  phases: z.array(programPhaseSchema),
  syllabusDocumentId: stringOrNullSchema,
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, replacePhasesSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await replaceCoordinatorProgramPhases(
        auth.session.userId,
        id,
        body.data.phases,
        body.data.syllabusDocumentId,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("phasesSaveFailed"),
    });
  }
}
