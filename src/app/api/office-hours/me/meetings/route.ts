import { fetchAcademicianOfficeHoursMeetings } from "@/lib/api/office-hours-me";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    return backendResponse(
      await fetchAcademicianOfficeHoursMeetings(session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("officeHoursLoadFailed"),
    });
  }
}
