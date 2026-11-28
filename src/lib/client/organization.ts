import { clientText } from "@/i18n/client-texts";
import type {
  CreateStartupInput,
  StartupProfile,
  StartupProfileInput,
  StartupStatusInput,
} from "@/interfaces/organization";
import type { AppSession, BackendUser } from "@/interfaces/session";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { refreshSession } from "@/lib/client/auth";
import { backendHttp } from "@/lib/client/backend-http";
import { ownOrganizationPath } from "@/lib/client/own-organization";

export async function getStartupProfile() {
  return requireSuccess(
    await backendHttp.get<StartupProfile>(await ownOrganizationPath()),
  );
}

export async function getOrganizationById(organizationId: string) {
  return requireSuccess(
    await backendHttp.get<StartupProfile>(
      `/api/organizations/${encodeURIComponent(organizationId)}`,
    ),
  );
}

export async function saveStartupProfile(profile: StartupProfileInput) {
  return requireSuccess(
    await backendHttp.put<StartupProfile>(await ownOrganizationPath(), profile),
  );
}

/**
 * The backend changed which startup the caller is in; the app's own session reads the account again so it carries
 * the change, and that session is the answer.
 */
export async function sessionAfterTeamChange(): Promise<AppSession> {
  const session = await refreshSession();
  if (!session) {
    throw new ClientApiError(clientText("http401"), 401, "SESSION_REQUIRED");
  }
  return session;
}

/** "Kodum var" on /startup. Answers with the session, now carrying the startup. */
export async function joinStartup(inviteCode: string) {
  requireSuccess(
    await backendHttp.post<BackendUser>("/api/organizations/join", {
      inviteCode,
    }),
  );
  return sessionAfterTeamChange();
}

/** "Startup'ımı oluştur" on /startup. Answers with the session, now carrying the startup. */
export async function createStartup(input: CreateStartupInput) {
  requireSuccess(
    await backendHttp.post<BackendUser>("/api/organizations/mine", input),
  );
  return sessionAfterTeamChange();
}

/** A rejected startup's founder sends it back to the coordinator. */
export async function resubmitStartup() {
  return requireSuccess(
    await backendHttp.post<StartupProfile>(
      await ownOrganizationPath("/resubmit"),
    ),
  );
}

export async function saveStartupStatus(status: StartupStatusInput) {
  return requireSuccess(
    await backendHttp.put<StartupProfile>(
      await ownOrganizationPath("/status"),
      status,
    ),
  );
}
