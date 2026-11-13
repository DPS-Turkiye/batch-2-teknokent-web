import {
  ProfileAnalysisType,
  type ProfileAnalysis,
  type ProfileOcrMode,
} from "@/interfaces/profile-analysis";
import { requireSuccess } from "@/lib/client/api";
import { bearerHeader } from "@/lib/client/bearer";
import { getPublicBackendUrl } from "@/lib/const";
import { httpClient, UPLOAD_TIMEOUT_MS } from "@/lib/http-client";

async function uploadConfig() {
  return { headers: await bearerHeader(), timeout: UPLOAD_TIMEOUT_MS };
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
  ocrMode: ProfileOcrMode;
  profileType: ProfileAnalysisType;
  consentAccepted: boolean;
  appUserId?: string;
}) {
  const data = new FormData();
  data.set("file", input.file);
  const query = new URLSearchParams({
    profileType: input.profileType,
    consentAccepted: String(input.consentAccepted),
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
  profileType: ProfileAnalysisType;
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
 * The fields the profile screens read out of a parsed CV. The backend returns
 * the whole schema for the requested type; the mentor-only fields stay empty
 * for a mentee CV.
 */
export type ParsedCvProfile = {
  full_name?: string | null;
  current_role?: string | null;
  desired_role?: string | null;
  current_company?: string | null;
  professional_summary?: string | null;
  professional_functions?: string[] | null;
  technologies?: string[] | null;
  industries?: string[] | null;
  experience_level?: string | null;
  years_of_experience?: number | null;
  work_history?: ParsedCvRole[] | null;
  department?: string | null;
  study_year?: string | null;
  strong_courses?: string[] | null;
  student_projects?: string[] | null;
  exchange_experience?: string | null;
  education?: ParsedCvEducation[] | null;
};

export type ParsedCvEducation = {
  school: string;
  degree: string | null;
  period: string | null;
};

export type ParsedCvRole = {
  title: string;
  organization: string | null;
  period: string | null;
  summary: string | null;
};

export type CvSource = File | { documentId: string };

/**
 * A new file is sent along; a stored CV is read where it already is.
 * `consentAccepted` is the person's own answer to the reading consent: the
 * backend refuses to read a CV without it, so it is never filled in here.
 */
export function readCv(
  source: CvSource,
  consentAccepted: boolean,
  profileType: ProfileAnalysisType = ProfileAnalysisType.Personal,
) {
  return source instanceof File
    ? parseCv(source, consentAccepted, profileType)
    : parseStoredCv(source.documentId, consentAccepted, profileType);
}

/** Parses a CV the person already uploaded, so it does not travel again. */
export async function parseStoredCv(
  documentId: string,
  consentAccepted: boolean,
  profileType: ProfileAnalysisType = ProfileAnalysisType.Personal,
) {
  const query = new URLSearchParams({
    profileType,
    consentAccepted: String(consentAccepted),
  });
  return requireSuccess(
    await httpClient.post<ParsedCvProfile>(
      `${getPublicBackendUrl()}/api/profile-analyses/preview/documents/${encodeURIComponent(documentId)}?${query}`,
      undefined,
      await uploadConfig(),
    ),
  );
}

export async function parseCv(
  file: File,
  consentAccepted: boolean,
  profileType: ProfileAnalysisType = ProfileAnalysisType.Personal,
) {
  const data = new FormData();
  data.set("file", file);
  const query = new URLSearchParams({
    profileType,
    consentAccepted: String(consentAccepted),
  });
  return requireSuccess(
    await httpClient.post<ParsedCvProfile>(
      `${getPublicBackendUrl()}/api/profile-analyses/preview?${query}`,
      data,
      await uploadConfig(),
    ),
  );
}
