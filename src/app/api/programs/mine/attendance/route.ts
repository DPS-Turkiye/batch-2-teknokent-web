import { type NextRequest, NextResponse } from "next/server";

import {
  checkInMyAttendance,
  fetchMyAttendance,
} from "@/lib/api/program-attendance";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireStartupSession } from "@/lib/server/require-program-access";

/** The signed-in participant's own check-in; the actor is always the session user. */
export async function GET() {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchMyAttendance(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    const body = (await request.json().catch(() => null)) as {
      week?: unknown;
    } | null;
    const week = body?.week;
    if (typeof week !== "number" || !Number.isInteger(week) || week < 1) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("attendanceCheckInFailed"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await checkInMyAttendance(auth.session.userId, week),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceCheckInFailed"),
    });
  }
}
