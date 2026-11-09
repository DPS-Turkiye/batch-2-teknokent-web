import { type NextRequest, NextResponse } from "next/server";

import { fetchProgramAttendance } from "@/lib/api/program-attendance";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readOptionalReportRange } from "@/lib/server/report-range";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const range = readOptionalReportRange(request);
    if (range === undefined) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("dateRangeInvalid") },
        { status: 400 },
      );
    }
    const { id } = await params;
    return backendResponse(
      await fetchProgramAttendance(auth.session.userId, id, range),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceLoadFailed"),
    });
  }
}
