import type {
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
} from "@/interfaces/mentor";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const AVAILABILITY_PATH = "/api/office-hours/availability";

export async function getOfficeHoursAvailability() {
  return requireSuccess(
    await httpClient.get<MentorAvailabilitySettings>(AVAILABILITY_PATH),
  );
}

export async function updateOfficeHoursAvailability(
  payload: UpdateMentorAvailabilitySettingsPayload,
) {
  return requireSuccess(
    await httpClient.put<MentorAvailabilitySettings>(
      AVAILABILITY_PATH,
      payload,
    ),
  );
}
