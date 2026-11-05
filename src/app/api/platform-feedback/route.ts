import { NextResponse } from "next/server";

import { postPlatformFeedback } from "@/lib/api/platform-feedback";
import { platformFeedbackSubmissionSchema } from "@/lib/platform-feedback";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const parsed = platformFeedbackSubmissionSchema.safeParse(
      await request.json().catch(() => null),
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
    return backendResponse(await postPlatformFeedback(userId, parsed.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("platformFeedbackSendFailed"),
    });
  }
}
