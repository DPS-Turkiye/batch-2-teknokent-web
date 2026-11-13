import { fetchAdviseeProfile } from "@/lib/api/institution";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { invalidRequest } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";
import { isUuid } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { userId } = await params;
    if (!isUuid(userId)) {
      return await invalidRequest("invalidRequestFields", ["userId"]);
    }
    return backendResponse(await fetchAdviseeProfile(session.userId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("adviseeProfileLoadFailed"),
    });
  }
}
