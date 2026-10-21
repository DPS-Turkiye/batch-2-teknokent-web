import {
  removeProgramTeam,
  updateProgramTeam,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; inviteId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, inviteId } = await params;
    const body = await request.json();
    return backendResponse(
      await updateProgramTeam(auth.session.userId, id, inviteId, {
        teamName: body.teamName,
        leadEmail: body.leadEmail,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamUpdateFailed"),
    });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
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
