import { z } from "zod";

import { deleteOwnAccount } from "@/lib/api/self-deletion";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { destroySession, getSessionIds } from "@/lib/session";

const deleteOwnAccountSchema = z.object({
  confirmation: z.string().trim().min(1).max(32),
});

export async function POST(request: Request) {
  try {
    const { userId } = await getSessionIds();
    // The backend takes the account to delete, and how recent the sign-in is, from this token alone.
    const idToken = readBearerToken(request);
    if (!userId || !idToken) throw new SessionRequiredError();
    const body = await readJsonBody(request, deleteOwnAccountSchema);
    if (!body.ok) return body.response;
    const result = await deleteOwnAccount(body.data.confirmation, idToken);
    // The account is gone, so its session cookie goes now too, even if the browser never gets to sign out.
    if (result.status >= 200 && result.status < 300) await destroySession();
    return backendResponse(result);
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("accountDeleteFailed"),
    });
  }
}
