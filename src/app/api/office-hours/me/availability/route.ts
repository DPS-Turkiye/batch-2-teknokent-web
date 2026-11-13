import { NextResponse, type NextRequest } from "next/server";

import type { BackendOfficeHoursAvailability } from "@/lib/api/lti";
import {
  fetchMyOfficeHoursAvailability,
  saveMyOfficeHoursAvailability,
} from "@/lib/api/office-hours-me";
import {
  toBackendPayload,
  toEditorSettings,
} from "@/lib/office-hours-availability";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import type { BackendResponse } from "@/lib/server/backend-client";
import { officeHoursAvailabilitySchema } from "@/lib/server/office-hours-me-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    return editorResponse(await fetchMyOfficeHoursAvailability(session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySettingsLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = await readJsonBody(request, officeHoursAvailabilitySchema);
    if (!body.ok) return body.response;
    return editorResponse(
      await saveMyOfficeHoursAvailability(
        session.userId,
        toBackendPayload(body.data),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySettingsUpdateFailed"),
    });
  }
}

/** The availability editor speaks the mentor shape (menteeCapacity); a failure passes through as it is. */
function editorResponse(
  response: BackendResponse<BackendOfficeHoursAvailability>,
) {
  if (response.status !== 200) return backendResponse(response);
  return NextResponse.json(toEditorSettings(response.data));
}
