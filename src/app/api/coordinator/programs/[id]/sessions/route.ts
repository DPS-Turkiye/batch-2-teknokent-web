import { type NextRequest, NextResponse } from "next/server";

import { fetchProgramSessions } from "@/lib/api/program-report";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readReportRange } from "@/lib/server/report-range";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const range = readReportRange(request);
    if (!range) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("dateInvalid") },
        { status: 400 },
      );
    }
    const { id } = await params;
    return backendResponse(
      await fetchProgramSessions(auth.session.userId, id, range.from, range.to),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("sessionsLoadFailed"),
    });
  }
}
