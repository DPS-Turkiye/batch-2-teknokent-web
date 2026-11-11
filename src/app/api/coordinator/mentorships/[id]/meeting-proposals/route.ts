import { z } from "zod";

import { proposeMeeting } from "@/lib/api/meeting-proposals";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

const proposeMeetingSchema = z.object({
  scheduledAt: z.string(),
  durationMinutes: z.number(),
  agenda: stringOrNullSchema,
  replacesMeetingId: stringOrNullSchema,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, proposeMeetingSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await proposeMeeting(auth.session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingProposeFailed"),
    });
  }
}
