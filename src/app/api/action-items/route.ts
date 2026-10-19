import { NextResponse, type NextRequest } from "next/server";

import { createActionItem, fetchActionItems } from "@/lib/api/action-items";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

async function missingRequestId() {
  return NextResponse.json(
    { code: "INVALID_REQUEST", message: await apiText("requestIdRequired") },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    await getSessionIds();
    const requestId = request.nextUrl.searchParams.get("requestId");
    if (!requestId) return missingRequestId();

    return backendResponse(await fetchActionItems(requestId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("actionItemsLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await getSessionIds();
    const { requestId, ...payload } = (await request.json()) as Record<
      string,
      unknown
    >;
    if (typeof requestId !== "string") return missingRequestId();

    return backendResponse(
      await createActionItem({ ...payload, mentorshipRequestId: requestId }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("actionItemCreateFailed"),
    });
  }
}
