import "server-only";

import type {
  OfficeHoursAcademicianMeeting,
  OfficeHoursAlternativeInput,
  OfficeHoursAnswerInput,
  OfficeHoursInboxRequest,
  OfficeHoursListedAcademician,
  OfficeHoursProfile,
  OfficeHoursRequestInput,
  OfficeHoursStudentRequest,
  OfficeHoursTimeRange,
} from "@/interfaces/office-hours-me";
import type { BackendOfficeHoursAvailability } from "@/lib/api/lti";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

// Office hours for the signed-in Menton account (ODTÜ edition); the actor always comes from the session.
const BASE = "/api/office-hours/me";

type AvailabilityPayload = Omit<
  BackendOfficeHoursAvailability,
  "rules" | "exceptions"
> & {
  rules: Omit<BackendOfficeHoursAvailability["rules"][number], "id">[];
  exceptions: Omit<
    BackendOfficeHoursAvailability["exceptions"][number],
    "id"
  >[];
};

export function fetchMyOfficeHoursAvailability(actorId: string) {
  return backendRequest<BackendOfficeHoursAvailability>({
    method: HttpMethod.Get,
    url: `${BASE}/availability`,
    params: { actorId },
  });
}

export function saveMyOfficeHoursAvailability(
  actorId: string,
  payload: AvailabilityPayload,
) {
  return backendRequest<BackendOfficeHoursAvailability>({
    method: HttpMethod.Put,
    url: `${BASE}/availability`,
    params: { actorId },
    data: payload,
  });
}

export function fetchMyOfficeHoursProfile(actorId: string) {
  return backendRequest<OfficeHoursProfile>({
    method: HttpMethod.Get,
    url: `${BASE}/profile`,
    params: { actorId },
  });
}

export function saveMyOfficeHoursProfile(
  actorId: string,
  profile: OfficeHoursProfile,
) {
  return backendRequest<OfficeHoursProfile>({
    method: HttpMethod.Put,
    url: `${BASE}/profile`,
    params: { actorId },
    data: profile,
  });
}

export function fetchOfficeHoursInbox(actorId: string) {
  return backendRequest<OfficeHoursInboxRequest[]>({
    method: HttpMethod.Get,
    url: `${BASE}/inbox`,
    params: { actorId },
  });
}

export function answerOfficeHoursRequest(
  actorId: string,
  requestId: string,
  answer: OfficeHoursAnswerInput,
) {
  return backendRequest<OfficeHoursInboxRequest>({
    method: HttpMethod.Post,
    url: `${BASE}/requests/${encodeURIComponent(requestId)}/decision`,
    params: { actorId },
    data: answer,
  });
}

export function fetchAcademicianOfficeHoursMeetings(actorId: string) {
  return backendRequest<OfficeHoursAcademicianMeeting[]>({
    method: HttpMethod.Get,
    url: `${BASE}/meetings`,
    params: { actorId },
  });
}

export function fetchListedAcademicians(actorId: string) {
  return backendRequest<OfficeHoursListedAcademician[]>({
    method: HttpMethod.Get,
    url: `${BASE}/academicians`,
    params: { actorId },
  });
}

export function fetchListedAcademician(actorId: string, academicianId: string) {
  return backendRequest<OfficeHoursListedAcademician>({
    method: HttpMethod.Get,
    url: `${BASE}/academicians/${encodeURIComponent(academicianId)}`,
    params: { actorId },
  });
}

export function fetchAcademicianOpenSlots(
  actorId: string,
  academicianId: string,
) {
  return backendRequest<OfficeHoursTimeRange[]>({
    method: HttpMethod.Get,
    url: `${BASE}/academicians/${encodeURIComponent(academicianId)}/slots`,
    params: { actorId },
  });
}

export function createOfficeHoursRequest(
  actorId: string,
  input: OfficeHoursRequestInput,
) {
  return backendRequest<OfficeHoursStudentRequest>({
    method: HttpMethod.Post,
    url: `${BASE}/requests`,
    params: { actorId },
    data: input,
  });
}

export function fetchMyOfficeHoursRequests(actorId: string) {
  return backendRequest<OfficeHoursStudentRequest[]>({
    method: HttpMethod.Get,
    url: `${BASE}/appointments`,
    params: { actorId },
  });
}

export function answerOfficeHoursAlternative(
  actorId: string,
  requestId: string,
  answer: OfficeHoursAlternativeInput,
) {
  return backendRequest<OfficeHoursStudentRequest>({
    method: HttpMethod.Post,
    url: `${BASE}/requests/${encodeURIComponent(requestId)}/alternative`,
    params: { actorId },
    data: answer,
  });
}
