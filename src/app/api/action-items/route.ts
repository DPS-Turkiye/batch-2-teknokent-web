import { NextResponse, type NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import {
  fetchActionItems,
  fetchOrganizationActionItems,
  fetchActionItemsForRequests,
} from "@/lib/api/action-items";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { SIDE_PARAM, sessionSide } from "@/lib/server/session-side";
import { getSessionUser } from "@/lib/session";

async function missingRequestId() {
  return NextResponse.json(
    { code: "INVALID_REQUEST", message: await apiText("requestIdRequired") },
    { status: 400 },
  );
}

async function callerScope(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) throw new SessionRequiredError();
  const side = sessionSide(
    session,
    request.nextUrl.searchParams.get(SIDE_PARAM),
  );
  if (side === UserRole.Mentee && session.organizationId) {
    return { organizationId: session.organizationId };
  }
  if (side === UserRole.Mentor) return { mentorId: session.userId };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const caller = await callerScope(request);
    if (!caller) {
      return NextResponse.json(
        {
          code: "FORBIDDEN",
          message: await apiText("actionItemsMenteesAndMentorsOnly"),
        },
        { status: 403 },
      );
    }
    if (request.nextUrl.searchParams.get("scope") === "organization") {
      if (!("organizationId" in caller) || !caller.organizationId) {
        return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
      }
      return backendResponse(
        await fetchOrganizationActionItems(caller.organizationId),
      );
    }
    const requestIds = request.nextUrl.searchParams.get("requestIds");
    if (requestIds !== null) {
      return backendResponse(
        await fetchActionItemsForRequests(
          requestIds.split(",").filter(Boolean),
          caller,
        ),
      );
    }
    const requestId = request.nextUrl.searchParams.get("requestId");
    if (!requestId) return missingRequestId();

    return backendResponse(await fetchActionItems(requestId, caller));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("actionItemsLoadFailed"),
    });
  }
}
