import {
  fetchPeerWeeklyReport,
  savePeerWeeklyReport,
} from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import {
  peerWeeklyReportSchema,
  readIsoDayParam,
} from "@/lib/server/peer-report-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ weekStart: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const week = await readIsoDayParam((await params).weekStart);
    if (!week.ok) return week.response;
    return backendResponse(await fetchPeerWeeklyReport(userId, week.day));
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
    const week = await readIsoDayParam((await params).weekStart);
    if (!week.ok) return week.response;
    const body = await readJsonBody(request, peerWeeklyReportSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await savePeerWeeklyReport(userId, week.day, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}
