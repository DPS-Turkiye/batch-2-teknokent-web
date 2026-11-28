import type {
  MentorAvailabilityRule,
  MentorAvailabilitySettings,
  MentorAvailabilitySlot,
  MentorProfile,
  UpdateMentorAvailabilitySettingsPayload,
  UpdateMentorProfilePayload,
} from "@/interfaces/mentor";
import { requireSuccess } from "@/lib/client/api";
import {
  backendHttp,
  signedInUserId,
  withToken,
} from "@/lib/client/backend-http";

/** The signed-in mentor's own path under /api/mentors; the backend refuses any other mentor's id. */
async function ownMentorPath(suffix = "", idToken?: string) {
  const mentorId = await signedInUserId(idToken);
  return `/api/mentors/${encodeURIComponent(mentorId)}${suffix}`;
}

export async function getMentorProfile() {
  return requireSuccess(
    await backendHttp.get<MentorProfile>(await ownMentorPath()),
  );
}

export async function updateMentorProfile(
  payload: UpdateMentorProfilePayload,
  idToken?: string,
) {
  return requireSuccess(
    await backendHttp.put<MentorProfile>(
      await ownMentorPath("", idToken),
      payload,
      withToken(idToken),
    ),
  );
}

export async function getAvailabilityRules() {
  return requireSuccess(
    await backendHttp.get<MentorAvailabilityRule[]>(
      await ownMentorPath("/availability-rules"),
    ),
  );
}

export async function getAvailabilitySettings() {
  return requireSuccess(
    await backendHttp.get<MentorAvailabilitySettings>(
      await ownMentorPath("/availability-settings"),
    ),
  );
}

export async function updateAvailabilitySettings(
  payload: UpdateMentorAvailabilitySettingsPayload,
  idToken?: string,
) {
  return requireSuccess(
    await backendHttp.put<MentorAvailabilitySettings>(
      await ownMentorPath("/availability-settings", idToken),
      payload,
      withToken(idToken),
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
    await backendHttp.post<MentorAvailabilityRule>(
      await ownMentorPath("/availability-rules"),
      payload,
    ),
  );
}

export async function deleteAvailabilityRule(ruleId: string) {
  requireSuccess(
    await backendHttp.delete<void>(
      await ownMentorPath(`/availability-rules/${encodeURIComponent(ruleId)}`),
    ),
  );
}

export async function getMentorAvailability() {
  return requireSuccess(
    await backendHttp.get<MentorAvailabilitySlot[]>(
      await ownMentorPath("/availability"),
    ),
  );
}

export async function createAvailabilitySlot(payload: {
  startsAt: string;
  durationMinutes: number;
}) {
  return requireSuccess(
    await backendHttp.post<MentorAvailabilitySlot>(
      await ownMentorPath("/availability"),
      payload,
    ),
  );
}

export async function deleteAvailabilitySlot(slotId: string) {
  requireSuccess(
    await backendHttp.delete<void>(
      await ownMentorPath(`/availability/${encodeURIComponent(slotId)}`),
    ),
  );
}
