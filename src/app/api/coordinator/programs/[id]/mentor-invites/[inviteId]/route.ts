import { cancelMentorInvite } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, inviteId } = await params;
    return backendResponse(
      await cancelMentorInvite(auth.session.userId, id, inviteId),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Davet geri alınamadı." });
  }
}
