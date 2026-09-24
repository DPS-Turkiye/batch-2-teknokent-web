import {
  fetchCoordinatorConversations,
  startCoordinatorConversation,
} from "@/lib/api/coordinator-conversations";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

// Coordinators, mentors and team members all have threads; the backend scopes each call to the actor.
export async function GET() {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    return backendResponse(await fetchCoordinatorConversations(userId));
  } catch (error) {
    return apiErrorResponse(error, { message: "Mesajlar yüklenemedi." });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const body = await request.json();
    return backendResponse(
      await startCoordinatorConversation(userId, {
        programId: body.programId,
        organizationId: body.organizationId ?? null,
        mentorId: body.mentorId ?? null,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Konuşma başlatılamadı." });
  }
}
