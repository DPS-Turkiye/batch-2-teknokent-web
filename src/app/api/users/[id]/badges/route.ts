import type { NextRequest } from "next/server";

import { fetchUserBadges } from "@/lib/api/badges";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

/** Anyone signed in may see another person's active badges (D5); the backend never sends more. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getSessionUser())) throw new SessionRequiredError();
    const { id } = await params;
    return backendResponse(await fetchUserBadges(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("badgesLoadFailed"),
    });
  }
}
