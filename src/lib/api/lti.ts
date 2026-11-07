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
