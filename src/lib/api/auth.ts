import "server-only";

import type { BackendUser } from "@/interfaces/session";
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
