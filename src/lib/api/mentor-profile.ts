import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchMentorProfile(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(mentorId)}`,
  });
}

/**
 * A mentor reading their own profile. The backend shows a mentor who is not approved yet only to themselves,
 * so the session's user is named as the actor; `fetchMentorProfile` reads somebody else's.
 */
export function fetchOwnMentorProfile(userId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(userId)}`,
    params: { actorId: userId },
  });
}

export function updateMentorProfile(
  mentorId: string,
  payload: Record<string, unknown>,
  idToken?: string,
) {
  return backendRequest(
    {
      method: HttpMethod.Put,
      url: `/api/mentors/${encodeURIComponent(mentorId)}`,
      data: payload,
    },
    idToken ? { idToken } : undefined,
  );
}

export function fetchMentorAvailabilityRules(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability-rules`,
  });
}

export function fetchMentorAvailabilitySettings(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability-settings`,
  });
}

export function updateMentorAvailabilitySettings(
  mentorId: string,
  payload: Record<string, unknown>,
  idToken?: string,
) {
  return backendRequest(
    {
      method: HttpMethod.Put,
      url: `/api/mentors/${encodeURIComponent(mentorId)}/availability-settings`,
      data: payload,
    },
    idToken ? { idToken } : undefined,
  );
}

export function createMentorAvailabilityRule(
  mentorId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability-rules`,
    data: payload,
  });
}

export function deleteMentorAvailabilityRule(mentorId: string, ruleId: string) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability-rules/${encodeURIComponent(ruleId)}`,
  });
}

export function fetchMentorAvailability(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
  });
}

/** A mentor's own slots, readable before approval too; see `fetchOwnMentorProfile`. */
export function fetchOwnMentorAvailability(userId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(userId)}/availability`,
    params: { actorId: userId },
  });
}

export function createMentorAvailabilitySlot(
  mentorId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
    data: payload,
  });
}

export function deleteMentorAvailabilitySlot(mentorId: string, slotId: string) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability/${encodeURIComponent(slotId)}`,
  });
}
