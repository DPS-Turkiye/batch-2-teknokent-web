import type {
  OcrMode,
  ProfileAnalysis,
  ProfileType,
} from "@/interfaces/profile-analysis";
import { requireSuccess } from "@/lib/client/api";
import { getPublicBackendUrl } from "@/lib/const";
import { currentIdToken } from "@/lib/firebase/auth";
import { UPLOAD_TIMEOUT_MS, httpClient } from "@/lib/http-client";

async function uploadConfig() {
  const token = await currentIdToken();
  if (!token) {
    throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
  }
  return {
    headers: { Authorization: `Bearer ${token}` },
    timeout: UPLOAD_TIMEOUT_MS,
  };
}

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
  const query = new URLSearchParams({
    profileType: input.profileType,
    consentAccepted: "true",
    ocrMode: input.ocrMode,
  });
  if (input.appUserId) query.set("appUserId", input.appUserId);
  return requireSuccess(
    await httpClient.post<ProfileAnalysis>(
      `${getPublicBackendUrl()}/api/profile-analyses?${query}`,
      data,
      await uploadConfig(),
    ),
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
  const query = new URLSearchParams({
    profileType: "individual_mentee",
    consentAccepted: "true",
  });
  return requireSuccess(
    await httpClient.post<ParsedCvProfile>(
      `${getPublicBackendUrl()}/api/profile-analyses/preview?${query}`,
      data,
      await uploadConfig(),
    ),
  );
}
