import { z } from "zod";

import { createMatch, fetchMatching } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const createMatchSchema = z.object({
  organizationId: z.string(),
  mentorId: z.string(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchMatching(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("matchesLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, createMatchSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createMatch(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("matchCreateFailed"),
    });
  }
}
