import { NextResponse, type NextRequest } from "next/server";

import { updateActionItem } from "@/lib/api/action-items";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { requestId, ...payload } = (await request.json()) as Record<
      string,
      unknown
    >;
    if (typeof requestId !== "string") {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "A requestId is required." },
        { status: 400 },
      );
    }

    return backendResponse(await updateActionItem(id, requestId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Action item could not be updated.",
    });
  }
}
