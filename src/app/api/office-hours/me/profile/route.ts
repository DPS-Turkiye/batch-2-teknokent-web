import type { NextRequest } from "next/server";

import {
  fetchMyOfficeHoursProfile,
  saveMyOfficeHoursProfile,
} from "@/lib/api/office-hours-me";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { officeHoursProfileSchema } from "@/lib/server/office-hours-me-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    return backendResponse(await fetchMyOfficeHoursProfile(session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("officeHoursLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = await readJsonBody(request, officeHoursProfileSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await saveMyOfficeHoursProfile(session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("officeHoursFailed"),
    });
  }
}
