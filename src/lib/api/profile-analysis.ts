import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export type ProfileType = "individual_mentee" | "mentee";
export type OcrMode = "auto" | "force" | "off";

export function fetchLatestProfileAnalysis(organizationId: string) {
  return backendRequest({
    method: "GET",
    url: "/api/profile-analyses/latest",
    params: { organizationId },
  });
}

export function createProfileAnalysis(options: {
  file: File;
  ocrMode: OcrMode;
  organizationId: string;
  profileType: ProfileType;
}) {
  const data = new FormData();
  data.set("file", options.file);
  return backendRequest({
    method: "POST",
    url: "/api/profile-analyses",
    params: {
      organizationId: options.organizationId,
      profileType: options.profileType,
      consentAccepted: true,
      ocrMode: options.ocrMode,
    },
    data,
    maxBodyLength: Infinity,
  });
}

export function createManualProfileAnalysis(
  organizationId: string,
  payload: unknown,
) {
  return backendRequest({
    method: "POST",
    url: "/api/profile-analyses/manual",
    params: { organizationId },
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
