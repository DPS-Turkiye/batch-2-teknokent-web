import { LtiLaunchError } from "@/interfaces/office-hours";

export function ltiErrorPath(reason: LtiLaunchError) {
  return `/office-hours/launch-error?${new URLSearchParams({ reason })}`;
}

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
