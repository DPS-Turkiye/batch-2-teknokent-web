import { updatePeerReportAction } from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readUuidParam } from "@/lib/server/path-params";
import { peerReportActionSchema } from "@/lib/server/peer-report-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ meetingId: string; actionId: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const { meetingId, actionId } = await params;
    const meeting = await readUuidParam(meetingId, "reportRequestInvalid");
    if (!meeting.ok) return meeting.response;
    const action = await readUuidParam(actionId, "reportRequestInvalid");
    if (!action.ok) return action.response;
    const body = await readJsonBody(request, peerReportActionSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updatePeerReportAction(
        userId,
        meeting.id,
        action.id,
        body.data.done,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}
