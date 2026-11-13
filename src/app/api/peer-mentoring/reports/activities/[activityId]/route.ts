import { deletePeerActivity, updatePeerActivity } from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readUuidParam } from "@/lib/server/path-params";
import { peerActivitySchema } from "@/lib/server/peer-report-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ activityId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const activity = await readUuidParam(
      (await params).activityId,
      "reportRequestInvalid",
    );
    if (!activity.ok) return activity.response;
    const body = await readJsonBody(request, peerActivitySchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updatePeerActivity(userId, activity.id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const activity = await readUuidParam(
      (await params).activityId,
      "reportRequestInvalid",
    );
    if (!activity.ok) return activity.response;
    return backendResponse(await deletePeerActivity(userId, activity.id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}
