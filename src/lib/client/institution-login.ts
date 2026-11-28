import type {
  DevPersona,
  InstitutionLoginCompletion,
  InstitutionLoginStart,
  InstitutionProvider,
} from "@/interfaces/institution-login";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { safeNextPath } from "@/lib/public-paths";

/** Where the login was started for; kept in this tab only, read back once when it completes. */
const NEXT_KEY = "menton_institution_login_next";

/**
 * Starts signing in through an institution. The backend binds the login to this browser with its own cookie, so
 * only this browser can complete it; `next` (an in-app path) waits in this tab for the way back.
 */
export async function startInstitutionLogin(
  provider: InstitutionProvider,
  next?: string | null,
) {
  const started = requireSuccess(
    await backendHttp.post<InstitutionLoginStart>(
      `/api/auth/institution/${provider}/start`,
    ),
  );
  const safeNext = safeNextPath(next ?? null);
  if (safeNext) sessionStorage.setItem(NEXT_KEY, safeNext);
  else sessionStorage.removeItem(NEXT_KEY);
  return started;
}

/**
 * Hands what the institution sent back to the backend, which trades its one-time code for a Firebase custom token
 * in the same call. The backend refuses a callback this browser did not start.
 */
export async function completeInstitutionLogin(
  provider: InstitutionProvider,
  state: string,
  params: Record<string, string>,
): Promise<InstitutionLoginCompletion> {
  const next = safeNextPath(sessionStorage.getItem(NEXT_KEY));
  sessionStorage.removeItem(NEXT_KEY);
  const { customToken } = requireSuccess(
    await backendHttp.post<{ customToken: string }>(
      `/api/auth/institution/${provider}/complete`,
      { state, params },
    ),
  );
  return { customToken, next };
}

export async function fetchDevPersonas() {
  return requireSuccess(
    await backendHttp.get<DevPersona[]>(
      "/api/auth/institution/odtu/dev-personas",
    ),
  );
}
