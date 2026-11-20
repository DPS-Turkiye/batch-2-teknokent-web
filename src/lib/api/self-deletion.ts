import "server-only";

import type {
  SelfDeletionOptions,
  StartupDeletionResult,
} from "@/interfaces/self-deletion";
import type { UserDeletionResult } from "@/interfaces/user-deletion";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/*
 * Each call goes with the person's own Firebase token instead of an actor id: the backend takes who is acting, and
 * when they last signed in, from the token alone, and refuses these calls on the shared service credentials.
 */

export function fetchSelfDeletionOptions(idToken: string) {
  return backendRequest<SelfDeletionOptions>(
    { method: HttpMethod.Get, url: "/api/me/deletion" },
    { idToken },
  );
}

export function deleteOwnAccount(confirmation: string, idToken: string) {
  return backendRequest<UserDeletionResult>(
    {
      method: HttpMethod.Post,
      url: "/api/me/delete",
      data: { confirmation },
    },
    { idToken },
  );
}

export function deleteOwnStartup(confirmName: string, idToken: string) {
  return backendRequest<StartupDeletionResult>(
    {
      method: HttpMethod.Post,
      url: "/api/me/startup/delete",
      data: { confirmName },
    },
    { idToken },
  );
}
