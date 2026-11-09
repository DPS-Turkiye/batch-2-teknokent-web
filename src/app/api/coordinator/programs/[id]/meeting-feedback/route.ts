import { type NextRequest, NextResponse } from "next/server";

import { fetchProgramMeetingFeedback } from "@/lib/api/program-report";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { ISO_DAY_PATTERN } from "@/lib/utils";

const MEETING_FEEDBACK_PAGE_SIZE = 20;
// The backend caps the page here too.
const MAX_PAGE = 10_000;

/** Who rated whom; the backend lets only this program's coordinators and admins read it. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const from = request.nextUrl.searchParams.get("from");
    const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
    const badDate = from != null && !ISO_DAY_PATTERN.test(from);
    if (badDate || !Number.isInteger(page) || page < 0 || page > MAX_PAGE) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText(
            badDate ? "dateInvalid" : "reportRequestInvalid",
          ),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await fetchProgramMeetingFeedback(auth.session.userId, id, {
        from,
        page,
        size: MEETING_FEEDBACK_PAGE_SIZE,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingFeedbackLoadFailed"),
    });
  }
}
