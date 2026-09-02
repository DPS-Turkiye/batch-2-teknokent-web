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

export function createProfileAnalysis(options: {
  file: File;
  ocrMode: OcrMode;
  organizationId: string;
  appUserId?: string;
  profileType: ProfileType;
}) {
  const data = new FormData();
  data.set("file", options.file);
  return backendRequest({
    method: "POST",
    url: "/api/profile-analyses",
    params: {
      organizationId: options.organizationId,
      appUserId: options.appUserId,
      profileType: options.profileType,
      consentAccepted: true,
      ocrMode: options.ocrMode,
    },
    data,
    maxBodyLength: Infinity,
  });
}

/**
 * Parse-only: the backend returns the structured profile and persists nothing,
 * so this is safe before the user has an organization for a write to be scoped
 * to. That is what makes it usable during signup, unlike createProfileAnalysis.
 */
export function parseCvPreview(file: File) {
  const data = new FormData();
  data.set("file", file);
  return backendRequest<Record<string, unknown>>({
    method: "POST",
    url: "/api/profile-analyses/preview",
    params: { consentAccepted: true, profileType: "individual_mentee" },
    data,
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
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

export function recommendFromProfileAnalysis(id: string) {
  return backendRequest({
    method: "POST",
    url: `/api/profile-analyses/${encodeURIComponent(id)}/recommendations`,
  });
}
