import { NextResponse, type NextRequest } from "next/server";

import { SessionsExportFormat } from "@/interfaces/program-report";
import { exportProgramAttendance } from "@/lib/api/program-attendance";
import { isEnumValue } from "@/lib/enum";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { readOptionalReportRange } from "@/lib/server/report-range";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const range = readOptionalReportRange(request);
    const format = request.nextUrl.searchParams.get("format");
    if (range === undefined || !isEnumValue(SessionsExportFormat, format)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("dateRangeInvalid") },
        { status: 400 },
      );
    }
    const { id } = await params;
    const file = await exportProgramAttendance(auth.session.userId, id, {
      range,
      format,
    });
    if (file.status !== 200) {
      return NextResponse.json(
        { message: await apiText("attendanceExportFailed") },
        { status: file.status },
      );
    }
    return new NextResponse(Buffer.from(file.data), {
      status: 200,
      headers: {
        "Content-Type": String(file.headers["content-type"]),
        "Content-Disposition": String(file.headers["content-disposition"]),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceExportFailed"),
    });
  }
}
