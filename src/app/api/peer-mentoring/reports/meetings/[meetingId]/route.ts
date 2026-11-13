import {
  fetchPeerMeetingReport,
  savePeerMeetingReport,
} from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readUuidParam } from "@/lib/server/path-params";
import { peerMeetingReportSchema } from "@/lib/server/peer-report-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ meetingId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const meeting = await readUuidParam(
      (await params).meetingId,
      "reportRequestInvalid",
    );
    if (!meeting.ok) return meeting.response;
    return backendResponse(await fetchPeerMeetingReport(userId, meeting.id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportsLoadFailed"),
    });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const meeting = await readUuidParam(
      (await params).meetingId,
      "reportRequestInvalid",
    );
    if (!meeting.ok) return meeting.response;
    const body = await readJsonBody(request, peerMeetingReportSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await savePeerMeetingReport(userId, meeting.id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}
