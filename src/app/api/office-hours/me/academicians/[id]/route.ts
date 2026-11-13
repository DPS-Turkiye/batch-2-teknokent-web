import { fetchListedAcademician } from "@/lib/api/office-hours-me";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { isOfficeHoursId } from "@/lib/server/office-hours-me-schemas";
import { invalidRequest } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await params;
    if (!isOfficeHoursId(id)) {
      return invalidRequest("invalidRequestFields", ["id"]);
    }
    return backendResponse(await fetchListedAcademician(session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("officeHoursLoadFailed"),
    });
  }
}
