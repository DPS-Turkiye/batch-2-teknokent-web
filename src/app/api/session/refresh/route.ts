import { NextResponse, type NextRequest } from "next/server";

import { UserAccountStatus } from "@/interfaces/session";
import { fetchSignedInUser } from "@/lib/api/auth";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser, refreshSessionUser } from "@/lib/session";

/**
 * Re-reads the signed-in account from the backend, so a permission granted after sign-in (a badge that makes a
 * student a mentor) applies at once. The Firebase token must belong to the session's own account; the session
 * keeps its sign-in time, "beni hatırla" and open workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const current = await getSessionUser();
    if (!current) throw new SessionRequiredError();
    const idToken = readBearerToken(request);
    if (!idToken) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("firebaseTokenRequired"),
        },
        { status: 400 },
      );
    }
    const response = await fetchSignedInUser(idToken);
    const user = response.data;
    if (
      response.status !== 200 ||
      user.id !== current.userId ||
      (user.status && user.status !== UserAccountStatus.Approved)
    ) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: await apiText("sessionRefreshFailed") },
        { status: 403 },
      );
    }
    const next = await refreshSessionUser(user, current.activeWorkspace);
    if (!next) {
      return NextResponse.json(
        {
          code: "SESSION_REQUIRED",
          message: await apiText("workspaceNotReady"),
        },
        { status: 409 },
      );
    }
    return NextResponse.json(next);
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("sessionRefreshFailed"),
    });
  }
}
