import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export type ProfileType = "individual_mentee" | "mentee";
export type OcrMode = "auto" | "force" | "off";

export function fetchLatestProfileAnalysis(
  organizationId: string,
  appUserId?: string,
) {
  return backendRequest({
    method: "GET",
    url: "/api/profile-analyses/latest",
    params: { organizationId, appUserId },
  });
}

export function createManualProfileAnalysis(
  organizationId: string,
  appUserId: string | undefined,
  payload: unknown,
) {
  return backendRequest({
    method: "POST",
    url: "/api/profile-analyses/manual",
    params: { organizationId, appUserId },
    data: payload,
  });
}

export function confirmProfileAnalysis(id: string, payload: unknown) {
  return backendRequest({
    method: "PATCH",
    url: `/api/profile-analyses/${encodeURIComponent(id)}/confirmation`,
    data: payload,
  });
}
