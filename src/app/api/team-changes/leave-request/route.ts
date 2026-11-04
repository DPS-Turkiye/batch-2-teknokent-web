import { requestLeave } from "@/lib/api/team-changes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function POST() {
  try {
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(await requestLeave(organizationId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamLeaveRequestFailed"),
    });
  }
}
