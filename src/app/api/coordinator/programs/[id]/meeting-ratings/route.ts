import { type NextRequest, NextResponse } from "next/server";

import { fetchProgramMeetingRatings } from "@/lib/api/program-report";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { ISO_DAY_PATTERN } from "@/lib/utils";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const from = request.nextUrl.searchParams.get("from");
    if (from != null && !ISO_DAY_PATTERN.test(from)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("dateInvalid") },
        { status: 400 },
      );
    }
    return backendResponse(
      await fetchProgramMeetingRatings(auth.session.userId, id, from),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingFeedbackLoadFailed"),
    });
  }
}
