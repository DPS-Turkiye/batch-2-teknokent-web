import { z } from "zod";

import {
  fetchCoordinatorConversations,
  startCoordinatorConversation,
} from "@/lib/api/coordinator-conversations";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

const startConversationSchema = z.object({
  programId: z.string(),
  organizationId: stringOrNullSchema,
  mentorId: stringOrNullSchema,
});

// Coordinators, mentors and team members all have threads; the backend scopes each call to the actor.
export async function GET() {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    return backendResponse(await fetchCoordinatorConversations(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("messagesLoadFailed"),
    });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const body = await readJsonBody(request, startConversationSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await startCoordinatorConversation(userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("conversationStartFailed"),
    });
  }
}
