import { sendProgramTeamCode } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; inviteId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, inviteId } = await params;
    return backendResponse(
      await sendProgramTeamCode(auth.session.userId, id, inviteId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("codeSendFailed"),
    });
  }
}
