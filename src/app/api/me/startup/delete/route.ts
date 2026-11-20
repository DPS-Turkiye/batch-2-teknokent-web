import { z } from "zod";

import { deleteOwnStartup } from "@/lib/api/self-deletion";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

const deleteOwnStartupSchema = z.object({
  confirmName: z.string().trim().min(1).max(255),
});

export async function POST(request: Request) {
  try {
    const { userId } = await getSessionIds();
    // The backend deletes only the startup this token's owner founded; no id travels in the request.
    const idToken = readBearerToken(request);
    if (!userId || !idToken) throw new SessionRequiredError();
    const body = await readJsonBody(request, deleteOwnStartupSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await deleteOwnStartup(body.data.confirmName, idToken),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupDeleteFailed"),
    });
  }
}
