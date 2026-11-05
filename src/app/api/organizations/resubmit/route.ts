import { resubmitStartup } from "@/lib/api/organization";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

/** A rejected startup's founder sends it back to the coordinator. */
export async function POST() {
  try {
    const { userId, organizationId } = await getSessionIds();
    return backendResponse(await resubmitStartup(organizationId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupResubmitFailed"),
    });
  }
}
