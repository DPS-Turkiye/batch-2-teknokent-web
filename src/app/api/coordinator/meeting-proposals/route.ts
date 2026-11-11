import { fetchCoordinatorMeetingProposals } from "@/lib/api/meeting-proposals";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET(request: Request) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
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
      message: await apiText("meetingProposalsLoadFailed"),
    });
  }
}
