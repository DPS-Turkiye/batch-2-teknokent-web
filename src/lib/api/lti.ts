import "server-only";

import type {
  LtiLaunchResult,
  OfficeHoursCourse,
} from "@/interfaces/office-hours";
import { backendRequest } from "@/lib/server/backend-client";
import { z } from "zod";

/**
 * Moodle posts these forms straight from the browser, so a field that is missing or malformed means the Moodle
 * side is set up wrong. Parsing here, before the backend is called, lets the caller say exactly which field.
 */
const loginInitiationSchema = z
  .object({
    iss: z.url(),
    login_hint: z.string().min(1),
    target_link_uri: z.url(),
    lti_message_hint: z.string().optional(),
    client_id: z.string().optional(),
    lti_deployment_id: z.string().optional(),
  })
  .transform((form) => ({
    issuer: form.iss,
    loginHint: form.login_hint,
    targetLinkUri: form.target_link_uri,
    ltiMessageHint: form.lti_message_hint,
    clientId: form.client_id,
    deploymentId: form.lti_deployment_id,
  }));

const launchSchema = z
  .object({ id_token: z.string().min(1), state: z.string().min(1) })
  .transform((form) => ({ idToken: form.id_token, state: form.state }));

export type LtiForm = Record<string, unknown>;

export class LtiRequestError extends Error {
  override name = "LtiRequestError";
}

function parseLtiForm<T>(schema: z.ZodType<T>, form: LtiForm): T {
  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    throw new LtiRequestError(
      parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  }
  return parsed.data;
}

/** Throws LtiRequestError, naming the field, when Moodle's login initiation is malformed. */
export async function startLtiLogin(form: LtiForm) {
  return backendRequest<{ redirectUrl: string }>({
    method: "POST",
    url: "/api/lti/login-initiations",
    data: parseLtiForm(loginInitiationSchema, form),
  });
}

/** Throws LtiRequestError, naming the field, when Moodle's launch post is malformed. */
export async function completeLtiLaunch(form: LtiForm) {
  return backendRequest<LtiLaunchResult>({
    method: "POST",
    url: "/api/lti/launches",
    data: parseLtiForm(launchSchema, form),
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

export const OFFICE_HOURS_COURSE_PATHS = [
  /^instructors$/,
  /^instructors\/[0-9a-f-]{36}\/slots$/,
  /^requests$/,
  /^requests\/[0-9a-f-]{36}\/(decision|reply|accept-proposed|withdraw)$/,
  /^meetings$/,
] as const;

export function officeHoursCourseUrl(
  userId: string,
  { courseId }: { courseId: string },
  path: string,
) {
  return `/api/office-hours/users/${encodeURIComponent(userId)}/courses/${encodeURIComponent(courseId)}/${path}`;
}
