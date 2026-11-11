import { postPlatformFeedback } from "@/lib/api/platform-feedback";
import { platformFeedbackSubmissionSchema } from "@/lib/platform-feedback";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const parsed = await readJsonBody(
      request,
      platformFeedbackSubmissionSchema,
      { invalidMessage: "platformFeedbackInvalid" },
    );
    if (!parsed.ok) return parsed.response;
    return backendResponse(await postPlatformFeedback(userId, parsed.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("platformFeedbackSendFailed"),
    });
  }
}
