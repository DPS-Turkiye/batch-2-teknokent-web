import { proposeReschedule } from "@/lib/api/meeting-proposals";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

// The mentor or a team member of the meeting; the backend checks which side the actor is on.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await proposeReschedule(userId, id, {
        scheduledAt: body.scheduledAt,
        durationMinutes: body.durationMinutes,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Yeni saat önerilemedi." });
  }
}
