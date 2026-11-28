import "server-only";

import type { BackendUser } from "@/interfaces/session";
import type { UserDeletionResult } from "@/interfaces/user-deletion";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The backend answers 404 unless `actorId` is the person, an admin, or related to them. */
export function fetchUser(userId: string, actorId: string, timeout?: number) {
  return backendRequest<BackendUser>({
    method: HttpMethod.Get,
    url: `/api/users/${encodeURIComponent(userId)}`,
    params: { actorId },
    ...(timeout ? { timeout } : {}),
  });
}

/**
 * Sent with the admin's own Firebase token instead of an actor id: the backend takes the acting admin from the
 * token and refuses this call on the shared service credentials.
 */
export function deleteUser(
  userId: string,
  confirmEmail: string,
  idToken: string,
) {
  return backendRequest<UserDeletionResult>(
    {
      method: HttpMethod.Post,
      url: `/api/admin/users/${encodeURIComponent(userId)}/delete`,
      data: { confirmEmail },
    },
    { idToken },
  );
}

export function revokeSignIns(userId: string, actorId: string) {
  return backendRequest<BackendUser>({
    method: HttpMethod.Post,
    url: `/api/users/${encodeURIComponent(userId)}/sign-ins/revoke`,
    data: { actorId },
  });
}
