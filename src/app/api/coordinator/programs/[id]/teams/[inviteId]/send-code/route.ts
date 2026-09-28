import { sendProgramTeamCode } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; inviteId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, inviteId } = await params;
    return backendResponse(
      await sendProgramTeamCode(auth.session.userId, id, inviteId),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Kod gönderilemedi." });
  }
}
