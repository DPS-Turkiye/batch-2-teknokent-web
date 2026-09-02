import type {
  OcrMode,
  ProfileAnalysis,
  ProfileType,
} from "@/interfaces/profile-analysis";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getLatestProfileAnalysis(appUserId?: string) {
  const query = appUserId ? `?appUserId=${encodeURIComponent(appUserId)}` : "";
  const response = await httpClient.get<ProfileAnalysis | null>(
    `/api/profile-analysis${query}`,
  );
  return response.status === 404 ? null : requireSuccess(response);
}

export async function uploadProfileAnalysis(input: {
  file: File;
  ocrMode: OcrMode;
  profileType: ProfileType;
  appUserId?: string;
}) {
  const data = new FormData();
  data.set("file", input.file);
  data.set("profileType", input.profileType);
  data.set("consentAccepted", "true");
  data.set("ocrMode", input.ocrMode);
  if (input.appUserId) data.set("appUserId", input.appUserId);
  return requireSuccess(
    await httpClient.post<ProfileAnalysis>("/api/profile-analysis", data),
  );
}

export async function createManualProfile(input: {
  profile: Record<string, unknown>;
  profileType: ProfileType;
  appUserId?: string;
}) {
  return requireSuccess(
    await httpClient.post<ProfileAnalysis>(
      "/api/profile-analysis/manual",
      input,
    ),
  );
}

export async function confirmProfile(input: {
  id: string;
  profile: Record<string, unknown>;
}) {
  return requireSuccess(
    await httpClient.patch<ProfileAnalysis>(
      `/api/profile-analysis/${encodeURIComponent(input.id)}/confirmation`,
      { profile: input.profile },
    ),
  );
}

/**
 * The fields the signup step reads out of a parsed CV. The backend returns the
 * whole individual_mentee schema; these are the parts this screen uses.
 */
export type ParsedCvProfile = {
  current_role?: string | null;
  desired_role?: string | null;
  professional_summary?: string | null;
  professional_functions?: string[] | null;
  technologies?: string[] | null;
  industries?: string[] | null;
};

export async function parseCv(file: File) {
  const data = new FormData();
  data.set("file", file);
  return requireSuccess(
    await httpClient.post<ParsedCvProfile>(
      "/api/profile-analysis/preview",
      data,
    ),
  );
}
