import { issueRealtimeToken } from "@/lib/api/meeting-notes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds, getSessionSignedInAt } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSessionIds();
    return backendResponse(
      await issueRealtimeToken(session, await getSessionSignedInAt()),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("realtimeTokenFailed"),
    });
  }
}
