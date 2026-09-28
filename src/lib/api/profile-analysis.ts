import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export type ProfileType = "individual_mentee" | "mentee";
export type OcrMode = "auto" | "force" | "off";

export function fetchLatestProfileAnalysis(
  organizationId: string,
  actorId: string,
  appUserId?: string,
) {
  return backendRequest({
    method: "GET",
    url: "/api/profile-analyses/latest",
    params: { organizationId, actorId, appUserId },
  });
}

export function createManualProfileAnalysis(
  organizationId: string,
  actorId: string,
  appUserId: string | undefined,
  payload: unknown,
) {
  return backendRequest({
    method: "POST",
    url: "/api/profile-analyses/manual",
    params: { organizationId, actorId, appUserId },
    data: payload,
  });
}

export function confirmProfileAnalysis(
  id: string,
  actorId: string,
  payload: unknown,
) {
  return backendRequest({
    method: "PATCH",
    url: `/api/profile-analyses/${encodeURIComponent(id)}/confirmation`,
    params: { actorId },
    data: payload,
  });
}

export function recommendFromProfileAnalysis(id: string, actorId: string) {
  return backendRequest({
    method: "POST",
    url: `/api/profile-analyses/${encodeURIComponent(id)}/recommendations`,
    params: { actorId },
  });
}
