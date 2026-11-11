import { renewMentorInvite } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, inviteId } = await params;
    return backendResponse(
      await renewMentorInvite(auth.session.userId, id, inviteId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("inviteRenewFailed"),
    });
  }
}
