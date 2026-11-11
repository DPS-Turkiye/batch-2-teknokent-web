import { z } from "zod";

import { decideProgramMentor } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

const decisionSchema = z.object({ accepted: z.boolean() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, mentorId } = await params;
    const body = await readJsonBody(request, decisionSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await decideProgramMentor(
        auth.session.userId,
        id,
        mentorId,
        body.data.accepted,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("decisionSaveFailed"),
    });
  }
}
