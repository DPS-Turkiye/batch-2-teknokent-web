import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchMentorProfile(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
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
) {
  return backendRequest({
    method: HttpMethod.Put,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability-settings`,
    data: payload,
  });
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
