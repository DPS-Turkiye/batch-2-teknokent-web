import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  checkInMyAttendance,
  fetchMyAttendance,
} from "@/lib/api/program-attendance";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireStartupSession } from "@/lib/server/require-program-access";

const checkInSchema = z.object({ week: z.int().min(1) });

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
    const body = await readJsonBody(request, checkInSchema, {
      invalidMessage: "attendanceCheckInFailed",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await checkInMyAttendance(auth.session.userId, body.data.week),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceCheckInFailed"),
    });
  }
}
