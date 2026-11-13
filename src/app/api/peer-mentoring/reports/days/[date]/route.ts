import {
  fetchPeerDailyReport,
  savePeerDailyReport,
} from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import {
  peerDailyReportSchema,
  readIsoDayParam,
} from "@/lib/server/peer-report-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ date: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const date = await readIsoDayParam((await params).date);
    if (!date.ok) return date.response;
    return backendResponse(await fetchPeerDailyReport(userId, date.day));
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
    const date = await readIsoDayParam((await params).date);
    if (!date.ok) return date.response;
    const body = await readJsonBody(request, peerDailyReportSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await savePeerDailyReport(userId, date.day, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportSaveFailed"),
    });
  }
}
