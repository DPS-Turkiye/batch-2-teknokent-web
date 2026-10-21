import { fetchMyAnnouncements } from "@/lib/api/program-announcements";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

// Team members and mentors; the backend picks the programs the signed-in actor belongs to.
export async function GET() {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    return backendResponse(await fetchMyAnnouncements(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("announcementsLoadFailed"),
    });
  }
}
