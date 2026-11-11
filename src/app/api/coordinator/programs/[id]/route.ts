import {
  fetchCoordinatorProgram,
  updateCoordinatorProgram,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { updateProgramSchema } from "@/lib/server/coordinator-program-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchCoordinatorProgram(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programLoadFailed"),
    });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, updateProgramSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateCoordinatorProgram(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programSaveFailed"),
    });
  }
}
