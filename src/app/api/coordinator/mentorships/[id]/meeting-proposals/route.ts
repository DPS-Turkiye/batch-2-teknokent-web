import { proposeMeeting } from "@/lib/api/meeting-proposals";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await proposeMeeting(auth.session.userId, id, {
        scheduledAt: body.scheduledAt,
        durationMinutes: body.durationMinutes,
        agenda: body.agenda ?? null,
        replacesMeetingId: body.replacesMeetingId ?? null,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingProposeFailed"),
    });
  }
}
