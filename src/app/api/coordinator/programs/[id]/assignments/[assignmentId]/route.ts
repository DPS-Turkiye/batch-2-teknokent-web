import { updateProgramAssignment } from "@/lib/api/program-assignments";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { updateProgramAssignmentSchema } from "@/lib/server/program-assignment-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; assignmentId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, assignmentId } = await params;
    const body = await readJsonBody(request, updateProgramAssignmentSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateProgramAssignment(
        auth.session.userId,
        id,
        assignmentId,
        body.data,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programAssignmentUpdateFailed"),
    });
  }
}
