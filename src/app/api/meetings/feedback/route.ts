import type { NextRequest } from "next/server";

import { fetchRatedMeetingIds } from "@/lib/api/meetings";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const meetingIds = (request.nextUrl.searchParams.get("meetingIds") ?? "")
      .split(",")
      .filter(Boolean);
    const { userId } = await getSessionIds();
    return backendResponse(await fetchRatedMeetingIds(meetingIds, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Değerlendirmeler yüklenemedi.",
    });
  }
}
