import { NextResponse, type NextRequest } from "next/server";

import { createActionItem, fetchActionItems } from "@/lib/api/action-items";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

function missingRequestId() {
  return NextResponse.json(
    { code: "INVALID_REQUEST", message: "A requestId is required." },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get("requestId");
    if (!requestId) return missingRequestId();

    return backendResponse(await fetchActionItems(requestId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Action items could not be loaded.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      message: "Action item could not be created.",
    });
  }
}
