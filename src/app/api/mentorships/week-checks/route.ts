import type { NextRequest } from "next/server";

import { fetchMentorshipWeekChecks } from "@/lib/api/mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionMentorId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const weekStart = request.nextUrl.searchParams.get("weekStart");
    if (!weekStart) {
      return apiErrorResponse(new Error("weekStart required"), {
        message: await apiText("weekStartRequired"),
        status: 400,
      });
    }
    return backendResponse(
      await fetchMentorshipWeekChecks({
        mentorId: await getSessionMentorId(),
        weekStart,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weeklyMentorshipsUnavailable"),
    });
  }
}
