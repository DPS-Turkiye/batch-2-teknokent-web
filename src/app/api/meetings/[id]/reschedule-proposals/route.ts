import { z } from "zod";

import { proposeReschedule } from "@/lib/api/meeting-proposals";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

const rescheduleSchema = z.object({
  scheduledAt: z.string(),
  durationMinutes: z.number(),
});

// The mentor or a team member of the meeting; the backend checks which side the actor is on.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    const body = await readJsonBody(request, rescheduleSchema);
    if (!body.ok) return body.response;
    return backendResponse(await proposeReschedule(userId, id, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("newTimeProposeFailed"),
    });
  }
}
