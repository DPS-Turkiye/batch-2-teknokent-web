import type { NextRequest } from "next/server";

import { fetchPeerReportMeetings } from "@/lib/api/peer-reports";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { peerReportRangeQuerySchema } from "@/lib/server/peer-report-schemas";
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
      peerReportRangeQuerySchema,
    );
    if (!query.ok) return query.response;
    return backendResponse(
      await fetchPeerReportMeetings(userId, query.data.from, query.data.to),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerReportsLoadFailed"),
    });
  }
}
