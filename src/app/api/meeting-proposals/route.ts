import { fetchMyMeetingProposals } from "@/lib/api/meeting-proposals";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

// Mentors and team members; the backend scopes the list to the signed-in actor.
export async function GET() {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    return backendResponse(await fetchMyMeetingProposals(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Görüşme önerileri yüklenemedi.",
    });
  }
}
