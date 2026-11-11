import { z } from "zod";

import { setCoordinatorProgramArchived } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const archiveSchema = z.object({ archived: z.boolean() });

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, archiveSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await setCoordinatorProgramArchived(
        auth.session.userId,
        id,
        body.data.archived,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programArchiveFailed"),
    });
  }
}
