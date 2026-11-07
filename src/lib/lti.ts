import { LtiLaunchError } from "@/interfaces/office-hours";

/** The error page a failed launch lands on; the reason only picks which explanation it shows. */
export function ltiErrorPath(reason: LtiLaunchError) {
  return `/office-hours/launch-error?${new URLSearchParams({ reason })}`;
}

/** The backend's refusal as one of the explanations the error page knows. */
export function ltiErrorFor(status: number): LtiLaunchError {
  if (status === 403) return LtiLaunchError.NoRole;
  if (status === 400 || status === 401) return LtiLaunchError.Rejected;
  return LtiLaunchError.Unavailable;
}

export function isLtiLaunchError(value: unknown): value is LtiLaunchError {
  return Object.values(LtiLaunchError).includes(value as LtiLaunchError);
}

export function officeHoursCoursePath(courseId: string) {
  return `/office-hours/courses/${encodeURIComponent(courseId)}`;
}
