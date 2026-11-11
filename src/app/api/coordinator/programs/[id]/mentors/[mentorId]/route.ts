import { withdrawProgramMentorInvite } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, mentorId } = await params;
    return backendResponse(
      await withdrawProgramMentorInvite(auth.session.userId, id, mentorId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("inviteWithdrawFailed"),
    });
  }
}
