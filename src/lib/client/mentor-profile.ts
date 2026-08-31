import type {
  MentorAvailabilitySlot,
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
