import { checkInSession } from "@/lib/api/program-attendance";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { sessionCheckInSchema } from "@/lib/server/attendance-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

/**
 * A scanned session QR code. Any signed-in user may try; the backend decides whether they are a participant of the
 * code's program, so a mentor or a member of another program gets its own explanation.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getSessionIds();
    if (!userId) throw new SessionRequiredError();
    const body = await readJsonBody(request, sessionCheckInSchema, {
      invalidMessage: "attendanceQrNotValid",
    });
    if (!body.ok) return body.response;
    return backendResponse(await checkInSession(userId, body.data.token));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceCheckInFailed"),
    });
  }
}
