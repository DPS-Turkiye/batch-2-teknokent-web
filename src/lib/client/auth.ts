import type { ProgramEligibility } from "@/interfaces/program";
import type { AppSession, BackendUser } from "@/interfaces/session";
import type { ContactPreference } from "@/interfaces/signup";
import type { Workspace } from "@/interfaces/workspace";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp, withToken } from "@/lib/client/backend-http";
import {
  readSession,
  signIn,
  switchSessionWorkspace,
} from "@/lib/client/session";
import { currentIdToken } from "@/lib/firebase/auth";
import type { Locale } from "@/lib/i18n";

export type FounderRegistration = {
  fullName: string;
  email: string;
  /** Required except in an individual-mentee program, where the backend names the team after the person. */
  organizationName?: string | undefined;
  description?: string | undefined;
  jobTitle?: string | undefined;
  phone?: string | undefined;
  programId?: string | null | undefined;
  bio?: string | undefined;
  linkedinUrl?: string | undefined;
  expertise?: string[] | undefined;
  /** The wizard's startup step. Collected since it was built, stored since V35. */
  website?: string | undefined;
  problem?: string | undefined;
  solution?: string | undefined;
  currentSolution?: string | undefined;
  targetUser?: string | undefined;
  sector?: string | undefined;
  maturity?: string | undefined;
  programLevel?: string | undefined;
  supportAreas?: string[] | undefined;
  contactPreferences?: ContactPreference[] | undefined;
  mvpUrl?: string | undefined;
  foundedYear?: number | undefined;
  teamMembers?:
    | {
        fullName: string;
        jobTitle?: string | undefined;
        email?: string | undefined;
      }[]
    | undefined;
};

export type MentorRegistration = {
  fullName: string;
  email: string;
  jobTitle?: string | undefined;
  phone?: string | undefined;
  /** The code from a program's mentor invite link (flow 03.1). */
  programInvite?: string | undefined;
};

export type MemberRegistration = {
  fullName: string;
  email: string;
  inviteCode: string;
  jobTitle?: string;
  phone?: string | undefined;
};

export async function getProgramEligibility(
  programId: string,
  idToken: string,
) {
  return requireSuccess(
    await backendHttp.get<ProgramEligibility>(
      "/api/auth/register/program-eligibility",
      { ...withToken(idToken), params: { programId } },
    ),
  );
}

// Registration runs before any session exists, so it rides on the Firebase token the sign-up just got.
export async function registerFounder(
  input: FounderRegistration,
  idToken: string,
) {
  return requireSuccess(
    await backendHttp.post<BackendUser>(
      "/api/auth/register/founder",
      input,
      withToken(idToken),
    ),
  );
}

export async function registerMentor(
  input: MentorRegistration,
  idToken: string,
) {
  return requireSuccess(
    await backendHttp.post<BackendUser>(
      "/api/auth/register/mentor",
      input,
      withToken(idToken),
    ),
  );
}

export async function registerMember(
  input: MemberRegistration,
  idToken: string,
) {
  return requireSuccess(
    await backendHttp.post<BackendUser>(
      "/api/auth/register/member",
      input,
      withToken(idToken),
    ),
  );
}

/** The account behind a Firebase sign-in, pending or rejected ones included (the application status page). */
export async function fetchAccountStatus(idToken: string) {
  return requireSuccess(
    await backendHttp.get<BackendUser>("/api/auth/me", withToken(idToken)),
  );
}

/**
 * Saves the language for the backend's notifications and e-mails. The Firebase token reaches a pending account
 * too, which has no session; signed out entirely, there is nobody to save it for.
 */
export async function saveLanguage(language: Locale) {
  const idToken = await currentIdToken();
  const response = await backendHttp.put(
    "/api/auth/me/language",
    { language },
    withToken(idToken ?? undefined),
  );
  if (response.status === 401) return;
  requireSuccess(response);
}

/** Signs in to the app and to the API: the API keeps its own HttpOnly session cookie from here on. */
export function createSession(idToken: string, rememberMe = false) {
  return signIn(idToken, rememberMe);
}

/**
 * Re-reads the account from the API after something changed what it may do (a badge awarded after sign-in).
 * Null when there is no session.
 */
export function refreshSession(): Promise<AppSession | null> {
  return readSession();
}

export function switchWorkspace(workspace: Workspace) {
  return switchSessionWorkspace(workspace);
}
