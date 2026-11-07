import { NextResponse, type NextRequest } from "next/server";

import type { UpdateMentorAvailabilitySettingsPayload } from "@/interfaces/mentor";
import {
  fetchOfficeHoursAvailability,
  saveOfficeHoursAvailability,
  type BackendOfficeHoursAvailability,
} from "@/lib/api/lti";
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
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

/** The signed-in academic's own office hours, in the shape the availability editor reads. */
export async function GET() {
  const user = await getOfficeHoursUser();
  if (!user) return sessionMissing();
  try {
    return editorResponse(await fetchOfficeHoursAvailability(user.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySettingsLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getOfficeHoursUser();
  if (!user) return sessionMissing();
  try {
    const payload =
      (await request.json()) as UpdateMentorAvailabilitySettingsPayload;
    return editorResponse(
      await saveOfficeHoursAvailability(user.userId, toBackendPayload(payload)),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySettingsUpdateFailed"),
    });
  }
}

function editorResponse(
  response: BackendResponse<BackendOfficeHoursAvailability>,
) {
  if (response.status !== 200) return backendResponse(response);
  return NextResponse.json(toEditorSettings(response.data as never));
}

async function sessionMissing() {
  return NextResponse.json(
    { code: "SESSION_REQUIRED", message: await apiText("sessionMissing") },
    { status: 401 },
  );
}
