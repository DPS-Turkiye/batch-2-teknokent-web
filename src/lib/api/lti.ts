import "server-only";

import type {
  LtiLaunchResult,
  OfficeHoursCourse,
} from "@/interfaces/office-hours";
import { backendRequest } from "@/lib/server/backend-client";

export type LtiLoginInitiation = {
  issuer: string;
  loginHint: string;
  targetLinkUri: string;
  ltiMessageHint?: string;
  clientId?: string;
  deploymentId?: string;
};

export function startLtiLogin(initiation: LtiLoginInitiation) {
  return backendRequest<{ redirectUrl: string }>({
    method: "POST",
    url: "/api/lti/login-initiations",
    data: initiation,
  });
}

export function completeLtiLaunch(idToken: string, state: string) {
  return backendRequest<LtiLaunchResult>({
    method: "POST",
    url: "/api/lti/launches",
    data: { idToken, state },
  });
}

export function fetchOfficeHoursCourse(userId: string, courseId: string) {
  return backendRequest<OfficeHoursCourse>({
    method: "GET",
    url: `/api/office-hours/users/${encodeURIComponent(userId)}/courses/${encodeURIComponent(courseId)}`,
  });
}

/** The backend's office-hours setup; it names the capacity for students, where a mentor's names it for mentees. */
export type BackendOfficeHoursAvailability = {
  rules: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotMinutes: number;
  }[];
  exceptions: {
    id: string;
    startsOn: string;
    endsOn: string;
    reason: string | null;
  }[];
  studentCapacity: number | null;
  defaultMeetingDurationMinutes: number;
  meetingBufferMinutes: number;
};

/** An academic's own office hours, for every course they teach. */
function availabilityUrl(userId: string) {
  return `/api/office-hours/users/${encodeURIComponent(userId)}/availability`;
}

export function fetchOfficeHoursAvailability(userId: string) {
  return backendRequest<BackendOfficeHoursAvailability>({
    method: "GET",
    url: availabilityUrl(userId),
  });
}

export function saveOfficeHoursAvailability(
  userId: string,
  payload: Omit<BackendOfficeHoursAvailability, "rules" | "exceptions"> & {
    rules: unknown[];
    exceptions: unknown[];
  },
) {
  return backendRequest<BackendOfficeHoursAvailability>({
    method: "PUT",
    url: availabilityUrl(userId),
    data: payload,
  });
}

/**
 * Office-hours booking calls for one course, made for the signed-in person. Only these paths go through, so the
 * route cannot be used to reach anything else on the backend.
 */
const COURSE_PATHS = [
  /^instructors$/,
  /^instructors\/[0-9a-f-]{36}\/slots$/,
  /^requests$/,
  /^requests\/[0-9a-f-]{36}\/(decision|reply|accept-proposed|withdraw)$/,
  /^meetings$/,
];

export function isOfficeHoursCoursePath(path: string) {
  return COURSE_PATHS.some((pattern) => pattern.test(path));
}

export function officeHoursCourseRequest(
  userId: string,
  courseId: string,
  path: string,
  method: "GET" | "POST",
  data?: unknown,
) {
  return backendRequest({
    method,
    url: `/api/office-hours/users/${encodeURIComponent(userId)}/courses/${encodeURIComponent(courseId)}/${path}`,
    data,
  });
}
