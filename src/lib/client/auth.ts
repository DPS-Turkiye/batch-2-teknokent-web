import type { ProgramEligibility } from "@/interfaces/program";
import type { AppSession, BackendUser } from "@/interfaces/session";
import type { ContactPreference } from "@/interfaces/signup";
import type { Workspace } from "@/interfaces/workspace";
import { requireSuccess } from "@/lib/client/api";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";
import type { Locale } from "@/lib/i18n";

export type FounderRegistration = {
  fullName: string;
  email: string;
  /** Required unless startupLater. */
  organizationName?: string | undefined;
  description?: string | undefined;
  jobTitle?: string | undefined;
  phone?: string | undefined;
  programId?: string | null | undefined;
  startupLater?: boolean | undefined;
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

function bearer(idToken: string) {
  return { headers: { Authorization: `Bearer ${idToken}` } };
}

export async function getProgramEligibility(
  programId: string,
  idToken: string,
) {
  return requireSuccess(
    await httpClient.get<ProgramEligibility>(
      `/api/auth/register/program-eligibility?programId=${encodeURIComponent(programId)}`,
      bearer(idToken),
    ),
  );
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

/**
 * Re-reads the account into the session after something changed what it may do (a badge awarded after sign-in).
 * Null when the browser has no Firebase sign-in to prove who it is.
 */
export async function refreshSession(): Promise<AppSession | null> {
  const idToken = await currentIdToken();
  if (!idToken) return null;
  return requireSuccess(
    await httpClient.post<AppSession>(
      "/api/session/refresh",
      {},
      bearer(idToken),
    ),
  );
}

export async function switchWorkspace(workspace: Workspace) {
  return requireSuccess(
    await httpClient.post<AppSession>("/api/session/workspace", { workspace }),
  );
}
