import type { NextRequest } from "next/server";

import { fetchPeerReportWeek } from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { peerReportWeekQuerySchema } from "@/lib/server/peer-report-schemas";
import { readSearchParams } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = session;
    const query = await readSearchParams(
      request.nextUrl.searchParams,
      peerReportWeekQuerySchema,
    );
    if (!query.ok) return query.response;
    return backendResponse(await fetchPeerReportWeek(userId, query.data.week));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportsLoadFailed"),
    });
  }
}
