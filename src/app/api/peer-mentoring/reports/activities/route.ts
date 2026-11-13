import { addPeerActivity } from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { peerActivitySchema } from "@/lib/server/peer-report-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const body = await readJsonBody(request, peerActivitySchema);
    if (!body.ok) return body.response;
    return backendResponse(await addPeerActivity(userId, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}
