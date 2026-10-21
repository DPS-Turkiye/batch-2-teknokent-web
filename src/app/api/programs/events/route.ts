import type { NextRequest } from "next/server";

import { fetchMemberProgramEvents } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

// The backend scopes events to the caller's own programs; the range is only passed on.
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const params = request.nextUrl.searchParams;
    return backendResponse(
      await fetchMemberProgramEvents(userId, {
        from: params.get("from") ?? "",
        to: params.get("to") ?? "",
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programEventsLoadFailed"),
    });
  }
}
