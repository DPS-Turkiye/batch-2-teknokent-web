import type {
  SelfDeletionOptions,
  StartupDeletionResult,
} from "@/interfaces/self-deletion";
import type { UserDeletionResult } from "@/interfaces/user-deletion";
import { requireSuccess } from "@/lib/client/api";
import {
  backendHttp,
  endBackendSession,
  withToken,
} from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

// The backend takes who is asking, and how recent the sign-in is, from the Firebase token alone.

export async function getSelfDeletionOptions(idToken: string) {
  return requireSuccess(
    await backendHttp.get<SelfDeletionOptions>(
      "/api/me/deletion",
      withToken(idToken),
    ),
  );
}

/**
 * Deletes the signed-in person's account. The account is gone, so its sessions go now too, even if the browser
 * never gets to sign out.
 */
export async function deleteOwnAccount(confirmation: string, idToken: string) {
  const result = requireSuccess(
    await backendHttp.post<UserDeletionResult>(
      "/api/me/delete",
      { confirmation },
      withToken(idToken),
    ),
  );
  await Promise.all([
    httpClient.delete("/api/session").catch(() => undefined),
    endBackendSession(),
  ]);
  return result;
}

/** The founder deletes their startup; no id travels, the backend deletes only the startup they founded. */
export async function deleteOwnStartup(confirmName: string, idToken: string) {
  return requireSuccess(
    await backendHttp.post<StartupDeletionResult>(
      "/api/me/startup/delete",
      { confirmName },
      withToken(idToken),
    ),
  );
}
