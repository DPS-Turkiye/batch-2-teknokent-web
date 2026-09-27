import { remindMeetingProposal } from "@/lib/api/meeting-proposals";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await remindMeetingProposal(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Hatırlatma gönderilemedi." });
  }
}
