import { z } from "zod";

import { extractSyllabusPhases } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

/** An empty date field means the program has no date yet. */
const optionalDateSchema = z
  .string()
  .nullish()
  .transform((value) => value || null);

const extractPhasesSchema = z.object({
  documentId: z.string(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

export async function POST(request: Request) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request, extractPhasesSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await extractSyllabusPhases(auth.session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("syllabusReadFailed"),
    });
  }
}
