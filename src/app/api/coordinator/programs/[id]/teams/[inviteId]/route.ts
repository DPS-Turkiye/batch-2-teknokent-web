import {
  removeProgramTeam,
  updateProgramTeam,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { teamInviteSchema } from "@/lib/server/coordinator-program-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; inviteId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, inviteId } = await params;
    const body = await readJsonBody(request, teamInviteSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateProgramTeam(auth.session.userId, id, inviteId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamUpdateFailed"),
    });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, inviteId } = await params;
    return backendResponse(
      await removeProgramTeam(auth.session.userId, id, inviteId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamRemoveFailed"),
    });
  }
}
