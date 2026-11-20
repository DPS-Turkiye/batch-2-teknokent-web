import type {
  SelfDeletionOptions,
  StartupDeletionResult,
} from "@/interfaces/self-deletion";
import type { UserDeletionResult } from "@/interfaces/user-deletion";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

function withToken(idToken: string) {
  return { headers: { Authorization: `Bearer ${idToken}` } };
}

export async function getSelfDeletionOptions(idToken: string) {
  return requireSuccess(
    await httpClient.get<SelfDeletionOptions>(
      "/api/me/deletion",
      withToken(idToken),
    ),
  );
}

export async function deleteOwnAccount(confirmation: string, idToken: string) {
  return requireSuccess(
    await httpClient.post<UserDeletionResult>(
      "/api/me/delete",
      { confirmation },
      withToken(idToken),
    ),
  );
}

export async function deleteOwnStartup(confirmName: string, idToken: string) {
  return requireSuccess(
    await httpClient.post<StartupDeletionResult>(
      "/api/me/startup/delete",
      { confirmName },
      withToken(idToken),
    ),
  );
}
