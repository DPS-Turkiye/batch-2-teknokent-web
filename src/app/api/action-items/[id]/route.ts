import { NextResponse, type NextRequest } from "next/server";

import { updateActionItem } from "@/lib/api/action-items";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSessionIds();
    const { id } = await params;
    const { requestId, ...payload } = (await request.json()) as Record<
      string,
      unknown
    >;
    if (typeof requestId !== "string") {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("requestIdRequired"),
        },
        { status: 400 },
      );
    }

    return backendResponse(await updateActionItem(id, requestId, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("actionItemUpdateFailed"),
    });
  }
}
