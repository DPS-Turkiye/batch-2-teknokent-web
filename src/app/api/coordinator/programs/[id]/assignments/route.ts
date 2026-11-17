import {
  createProgramAssignment,
  fetchProgramAssignments,
} from "@/lib/api/program-assignments";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { createProgramAssignmentSchema } from "@/lib/server/program-assignment-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramAssignments(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programAssignmentsLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, createProgramAssignmentSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createProgramAssignment(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programAssignmentCreateFailed"),
    });
  }
}
