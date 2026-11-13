import type { NextRequest } from "next/server";

import { createOfficeHoursRequest } from "@/lib/api/office-hours-me";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { officeHoursRequestSchema } from "@/lib/server/office-hours-me-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = await readJsonBody(request, officeHoursRequestSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createOfficeHoursRequest(session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("officeHoursFailed"),
    });
  }
}
