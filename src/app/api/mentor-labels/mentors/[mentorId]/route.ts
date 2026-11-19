import { fetchMentorProgramLabels } from "@/lib/api/mentor-labels";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mentorId: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { mentorId } = await params;
    return backendResponse(await fetchMentorProgramLabels(userId, mentorId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorLabelsLoadFailed"),
    });
  }
}
