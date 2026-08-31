import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchMentorProfile(mentorId: string) {
  return backendRequest({
    method: "GET",
    url: `/api/mentors/${encodeURIComponent(mentorId)}`,
  });
}

export function updateMentorProfile(
  mentorId: string,
  payload: Record<string, unknown>,
  idToken?: string,
) {
  return backendRequest(
    {
      method: "PUT",
      url: `/api/mentors/${encodeURIComponent(mentorId)}`,
      data: payload,
    },
    idToken ? { idToken } : undefined,
  );
}

export function fetchMentorAvailability(mentorId: string) {
  return backendRequest({
    method: "GET",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
  });
}

export function createMentorAvailabilitySlot(
  mentorId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: "POST",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
    data: payload,
  });
}

export function deleteMentorAvailabilitySlot(mentorId: string, slotId: string) {
  return backendRequest({
    method: "DELETE",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability/${encodeURIComponent(slotId)}`,
  });
}
