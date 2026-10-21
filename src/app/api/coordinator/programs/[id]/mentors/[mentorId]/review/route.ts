import { fetchMentorReview } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, mentorId } = await params;
    return backendResponse(
      await fetchMentorReview(auth.session.userId, id, mentorId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorDetailsLoadFailed"),
    });
  }
}
