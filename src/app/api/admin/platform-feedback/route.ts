import { NextResponse } from "next/server";

import { fetchPlatformFeedbackInbox } from "@/lib/api/platform-feedback";
import { feedbackInboxQuerySchema } from "@/lib/platform-feedback";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const params = new URL(request.url).searchParams;
    const parsed = feedbackInboxQuerySchema.safeParse(
      Object.fromEntries(params),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("platformFeedbackInvalid"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await fetchPlatformFeedbackInbox(
        auth.session.userId,
        parsed.data.page,
        parsed.data.unreadOnly,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("platformFeedbackLoadFailed"),
    });
  }
}
