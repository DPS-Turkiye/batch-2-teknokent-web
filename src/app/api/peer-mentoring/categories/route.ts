import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { fetchPeerCategories } from "@/lib/api/peer-mentoring";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const side =
      request.nextUrl.searchParams.get("as") === UserRole.Mentor
        ? UserRole.Mentor
        : UserRole.Mentee;
    return backendResponse(await fetchPeerCategories(session.userId, side));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerCategoriesLoadFailed"),
    });
  }
}
