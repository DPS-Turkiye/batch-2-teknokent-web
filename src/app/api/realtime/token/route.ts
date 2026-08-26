import { issueRealtimeToken } from "@/lib/api/meeting-notes";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function POST() {
  try {
    return backendResponse(await issueRealtimeToken(await getSessionIds()));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Realtime token could not be issued.",
    });
  }
}
