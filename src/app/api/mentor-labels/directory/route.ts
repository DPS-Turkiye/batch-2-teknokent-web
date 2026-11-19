import { fetchMentorLabelDirectory } from "@/lib/api/mentor-labels";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    return backendResponse(await fetchMentorLabelDirectory(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorLabelsLoadFailed"),
    });
  }
}
