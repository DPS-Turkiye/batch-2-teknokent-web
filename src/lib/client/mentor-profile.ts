import type {
  MentorAvailabilityRule,
  MentorAvailabilitySlot,
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
  MentorProfile,
  UpdateMentorProfilePayload,
} from "@/interfaces/mentor";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getMentorProfile() {
  return requireSuccess(
    await httpClient.get<MentorProfile>("/api/mentor-profile"),
  );
}

export async function updateMentorProfile(
  payload: UpdateMentorProfilePayload,
  idToken?: string,
) {
  return requireSuccess(
    await httpClient.put<MentorProfile>(
      "/api/mentor-profile",
      payload,
      idToken ? { headers: { Authorization: `Bearer ${idToken}` } } : undefined,
    ),
  );
}

export async function getAvailabilityRules() {
  return requireSuccess(
    await httpClient.get<MentorAvailabilityRule[]>(
      "/api/mentor-profile/availability-rules",
    ),
  );
}

export async function getAvailabilitySettings() {
  return requireSuccess(
    await httpClient.get<MentorAvailabilitySettings>(
      "/api/mentor-profile/availability-settings",
    ),
  );
}

export async function updateAvailabilitySettings(
  payload: UpdateMentorAvailabilitySettingsPayload,
  idToken?: string,
) {
  return requireSuccess(
    await httpClient.put<MentorAvailabilitySettings>(
      "/api/mentor-profile/availability-settings",
      payload,
      idToken ? { headers: { Authorization: `Bearer ${idToken}` } } : undefined,
    ),
  );
}

export async function createAvailabilityRule(payload: {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}) {
  return requireSuccess(
    await httpClient.post<MentorAvailabilityRule>(
      "/api/mentor-profile/availability-rules",
      payload,
    ),
  );
}

export async function deleteAvailabilityRule(ruleId: string) {
  return requireSuccess(
    await httpClient.delete(
      `/api/mentor-profile/availability-rules/${encodeURIComponent(ruleId)}`,
    ),
  );
}

export async function getMentorAvailability() {
  return requireSuccess(
    await httpClient.get<MentorAvailabilitySlot[]>(
      "/api/mentor-profile/availability",
    ),
  );
}

export async function createAvailabilitySlot(payload: {
  startsAt: string;
  durationMinutes: number;
}) {
  return requireSuccess(
    await httpClient.post<MentorAvailabilitySlot>(
      "/api/mentor-profile/availability",
      payload,
    ),
  );
}

export async function deleteAvailabilitySlot(slotId: string) {
  return requireSuccess(
    await httpClient.delete(
      `/api/mentor-profile/availability/${encodeURIComponent(slotId)}`,
    ),
  );
}
