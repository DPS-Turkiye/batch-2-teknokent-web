import { NextResponse, type NextRequest } from "next/server";

import { fetchCoordinatorCalendar } from "@/lib/api/coordinator-calendar";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { ISO_DAY_PATTERN } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const search = request.nextUrl.searchParams;
    const from = search.get("from") ?? "";
    const to = search.get("to") ?? "";
    if (!ISO_DAY_PATTERN.test(from) || !ISO_DAY_PATTERN.test(to)) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("dateRangeInvalid"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await fetchCoordinatorCalendar(auth.session.userId, {
        from,
        to,
        programId: search.get("programId"),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("calendarLoadFailed"),
    });
  }
}
