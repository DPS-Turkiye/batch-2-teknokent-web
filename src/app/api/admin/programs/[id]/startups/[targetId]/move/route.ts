import { z } from "zod";

import { moveStartupToProgram } from "@/lib/api/admin-program-members";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireAdminSession } from "@/lib/server/require-admin";

// The program in the path is the one the team moves into; the body names the one it leaves.
const moveSchema = z.object({ fromProgramId: z.uuid() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; targetId: string }> },
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const { id, targetId } = await params;
    const body = await readJsonBody(request, moveSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await moveStartupToProgram(
        auth.session.userId,
        id,
        targetId,
        body.data.fromProgramId,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programMoveFailed"),
    });
  }
}
