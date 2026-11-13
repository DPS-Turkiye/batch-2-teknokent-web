import type { NextRequest } from "next/server";

import { answerOfficeHoursRequest } from "@/lib/api/office-hours-me";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import {
  isOfficeHoursId,
  officeHoursAnswerSchema,
} from "@/lib/server/office-hours-me-schemas";
import { invalidRequest, readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await params;
    if (!isOfficeHoursId(id)) {
      return invalidRequest("invalidRequestFields", ["id"]);
    }
    const body = await readJsonBody(request, officeHoursAnswerSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await answerOfficeHoursRequest(session.userId, id, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("officeHoursFailed"),
    });
  }
}
