import { submitPeerWeeklyReport } from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readIsoDayParam } from "@/lib/server/path-params";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const week = await readIsoDayParam((await params).weekStart);
    if (!week.ok) return week.response;
    return backendResponse(await submitPeerWeeklyReport(userId, week.day));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}
