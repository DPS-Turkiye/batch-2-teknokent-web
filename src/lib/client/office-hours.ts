import type {
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
} from "@/interfaces/mentor";
import type { OfficeHoursCourse } from "@/interfaces/office-hours";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { officeHoursUserPath } from "@/lib/client/office-hours-session";

export async function getOfficeHoursAvailability() {
  return requireSuccess(
    await backendHttp.get<MentorAvailabilitySettings>(
      await officeHoursUserPath("availability"),
    ),
  );
}

export async function updateOfficeHoursAvailability(
  payload: UpdateMentorAvailabilitySettingsPayload,
) {
  return requireSuccess(
    await backendHttp.put<MentorAvailabilitySettings>(
      await officeHoursUserPath("availability"),
      payload,
    ),
  );
}

/** The course as the session's person sees it; a course they never launched from does not exist for them. */
export async function getOfficeHoursCourse(courseId: string) {
  return requireSuccess(
    await backendHttp.get<OfficeHoursCourse>(
      await officeHoursUserPath(`courses/${encodeURIComponent(courseId)}`),
    ),
  );
}
