import { fetchCoordinatorMeetingProposals } from "@/lib/api/meeting-proposals";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(request: Request) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const params = new URL(request.url).searchParams;
    return backendResponse(
      await fetchCoordinatorMeetingProposals(auth.session.userId, {
        programId: params.get("programId"),
        mentorshipId: params.get("mentorshipId"),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Görüşme önerileri yüklenemedi.",
    });
  }
}
