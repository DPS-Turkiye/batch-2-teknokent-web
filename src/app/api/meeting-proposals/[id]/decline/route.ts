import { z } from "zod";

import { declineMeetingProposal } from "@/lib/api/meeting-proposals";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

// The reason is optional, and so is the body itself.
const declineSchema = z
  .object({ reason: stringOrNullSchema })
  .default({ reason: null });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    const body = await readJsonBody(request, declineSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await declineMeetingProposal(userId, id, body.data.reason),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("answerSendFailed"),
    });
  }
}
