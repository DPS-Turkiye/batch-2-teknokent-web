import { NextResponse } from "next/server";

import { markPlatformFeedbackRead } from "@/lib/api/platform-feedback";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";
import { z } from "zod";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("platformFeedbackInvalid"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await markPlatformFeedbackRead(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("platformFeedbackReadFailed"),
    });
  }
}
