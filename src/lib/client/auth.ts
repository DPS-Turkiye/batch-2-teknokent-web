import type { ContactPreference } from "@/interfaces/signup";
import type { AppSession, BackendUser } from "@/interfaces/session";
import { requireSuccess } from "@/lib/client/api";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";
import type { Locale } from "@/lib/i18n";

export type FounderRegistration = {
  fullName: string;
  email: string;
  organizationName: string;
  description?: string;
  jobTitle?: string;
  phone?: string;
  /** Null is a real answer meaning no program, so it is sent rather than omitted. */
  programId?: string | null;
  bio?: string;
  linkedinUrl?: string;
  expertise?: string[];
  /** The wizard's startup step. Collected since it was built, stored since V35. */
  website?: string;
  problem?: string;
  solution?: string;
  currentSolution?: string;
  targetUser?: string;
  sector?: string;
  maturity?: string;
  programLevel?: string;
  supportAreas?: string[];
  contactPreferences?: ContactPreference[];
  mvpUrl?: string;
  foundedYear?: number;
  teamMembers?: { fullName: string; jobTitle?: string; email?: string }[];
};

export type MentorRegistration = {
  fullName: string;
  email: string;
  jobTitle?: string;
  phone?: string;
  /** The code from a program's mentor invite link (flow 03.1). */
  programInvite?: string;
};

export type MemberRegistration = {
  fullName: string;
  email: string;
  inviteCode: string;
  jobTitle?: string;
  phone?: string;
};

function bearer(idToken: string) {
  return { headers: { Authorization: `Bearer ${idToken}` } };
}

export async function registerFounder(
  input: FounderRegistration,
  idToken: string,
) {
  return requireSuccess(
    await httpClient.post<BackendUser>(
      "/api/auth/register/founder",
      input,
      bearer(idToken),
    ),
  );
}

export async function registerMentor(
  input: MentorRegistration,
  idToken: string,
) {
  return requireSuccess(
    await httpClient.post<BackendUser>(
      "/api/auth/register/mentor",
      input,
      bearer(idToken),
    ),
  );
}

export async function registerMember(
  input: MemberRegistration,
  idToken: string,
) {
  return requireSuccess(
    await httpClient.post<BackendUser>(
      "/api/auth/register/member",
      input,
      bearer(idToken),
    ),
  );
}

export async function fetchAccountStatus(idToken: string) {
  return requireSuccess(
    await httpClient.get<BackendUser>("/api/auth/status", bearer(idToken)),
  );
}

/** Saves the language for the backend's notifications and e-mails; signed out, there is nobody to save it for. */
export async function saveLanguage(language: Locale) {
  const idToken = await currentIdToken();
  if (!idToken) return;
  requireSuccess(
    await httpClient.put(
      "/api/session/language",
      { language },
      bearer(idToken),
    ),
  );
}

export async function createSession(idToken: string, rememberMe = false) {
  return requireSuccess(
    await httpClient.post<AppSession>(
      "/api/session",
      { rememberMe },
      bearer(idToken),
    ),
  );
}
