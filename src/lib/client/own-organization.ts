import { clientText } from "@/i18n/client-texts";
import type { BackendUser } from "@/interfaces/session";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

let asking: Promise<string> | null = null;

/**
 * The signed-in person's own startup, as the backend has it now, for paths under /api/organizations/{id} that mean
 * "my startup". The backend refuses any other id, so this only says which one is meant. It is asked afresh, one ask
 * shared by the calls made at the same moment, because joining, leaving or a coordinator's move changes it.
 * Without a startup it fails as the app's own routes did: 403.
 */
export function ownOrganizationId(): Promise<string> {
  asking ??= backendHttp
    .get<BackendUser>("/api/auth/me")
    .then((response) => {
      const organizationId = requireSuccess(response).organizationId;
      if (!organizationId) {
        throw new ClientApiError(clientText("http403"), 403, "FORBIDDEN");
      }
      return organizationId;
    })
    .finally(() => {
      asking = null;
    });
  return asking;
}

/** `/api/organizations/{own startup}` followed by `suffix`. */
export async function ownOrganizationPath(suffix = "") {
  return `/api/organizations/${encodeURIComponent(await ownOrganizationId())}${suffix}`;
}
