import { fetchSelfDeletionOptions } from "@/lib/api/self-deletion";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const { userId } = await getSessionIds();
    // The backend reads who is asking from this token alone; the shared service credentials cannot.
    const idToken = readBearerToken(request);
    if (!userId || !idToken) throw new SessionRequiredError();
    return backendResponse(await fetchSelfDeletionOptions(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("selfDeletionLoadFailed"),
    });
  }
}
