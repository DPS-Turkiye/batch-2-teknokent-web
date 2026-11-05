import { fetchTeamChanges } from "@/lib/api/team-changes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

/** The signed-in member's startup: leave and removal requests waiting for the coordinator. */
export async function GET() {
  try {
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(await fetchTeamChanges(organizationId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamChangesLoadFailed"),
    });
  }
}
