import "server-only";

import type { ProgramEligibility } from "@/interfaces/program";
import type { BackendUser } from "@/interfaces/session";
import { HttpMethod } from "@/lib/http-method";
import type { Locale } from "@/lib/i18n";
import { backendRequest } from "@/lib/server/backend-client";

export type RegisterRole = "founder" | "mentor" | "member";

export const REGISTER_ROLES: readonly RegisterRole[] = [
  "founder",
  "mentor",
  "member",
];

export function isRegisterRole(value: string): value is RegisterRole {
  return REGISTER_ROLES.includes(value as RegisterRole);
}

/** The backend reads the address from the token, so this only ever answers about the caller. */
export function fetchProgramEligibility(programId: string, idToken: string) {
  return backendRequest<ProgramEligibility>(
    {
      method: HttpMethod.Get,
      url: "/api/auth/register/program-eligibility",
      params: { programId },
    },
    { idToken },
  );
}

export function registerAccount(
  role: RegisterRole,
  payload: unknown,
  idToken: string,
) {
  return backendRequest<BackendUser>(
    {
      method: "POST",
      url: `/api/auth/register/${role}`,
      data: payload,
    },
    { idToken },
  );
}

export function fetchSignedInUser(idToken: string) {
  return backendRequest<BackendUser>(
    { method: "GET", url: "/api/auth/me" },
    { idToken },
  );
}

/** The language the backend writes this user's notifications and e-mails in. */
export function saveSignedInLanguage(idToken: string, language: Locale) {
  return backendRequest(
    {
      method: HttpMethod.Put,
      url: "/api/auth/me/language",
      data: { language },
    },
    { idToken },
  );
}
