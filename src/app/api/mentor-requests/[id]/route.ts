import type { NextRequest } from "next/server";

import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSessionIds();
    const { id } = await params;
    return backendResponse(await fetchMentorRequest(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorRequestServiceUnavailable"),
    });
  }
}
