import { clientLocale, clientText } from "@/i18n/client-texts";
import {
  UserAccountStatus,
  type AppSession,
  type BackendUser,
} from "@/interfaces/session";
import type { Workspace } from "@/interfaces/workspace";
import { saveAccountTypeCookie } from "@/lib/account-type";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import {
  backendHttp,
  endBackendSession,
  startBackendSession,
  withToken,
} from "@/lib/client/backend-http";
import {
  ACCOUNT_NOT_APPROVED,
  FORBIDDEN,
  REGISTRATION_REQUIRED,
  SESSION_REQUIRED,
} from "@/lib/const";
import { clientEdition } from "@/lib/edition";
import { readLastWorkspace, saveLastWorkspace } from "@/lib/last-workspace";
import {
  clearSignedInHint,
  readSignedInHint,
  writeSignedInHint,
} from "@/lib/session-hint";
import { toSession, withWorkspace } from "@/lib/session-model";

const ME_PATH = "/api/auth/me";
const LANGUAGE_PATH = "/api/auth/me/language";

/** The session with the workspace last switched to in this browser, when the account can still open it. */
function withRememberedWorkspace(session: AppSession): AppSession {
  const remembered = readLastWorkspace();
  return (remembered && withWorkspace(session, remembered)) ?? session;
}

function isApproved(user: BackendUser) {
  return (
    (user.status ?? UserAccountStatus.Approved) === UserAccountStatus.Approved
  );
}

function signedOut(): null {
  clearSignedInHint();
  return null;
}

/**
 * Signs in to the API: checks the Firebase sign-in's account, then trades the token for the API's HttpOnly session
 * cookie. A pending, rejected or half-registered account gets no session; the codes it is refused with are what the
 * login screens route on (lib/account-not-ready).
 */
export async function signIn(
  idToken: string,
  rememberMe = false,
): Promise<AppSession> {
  const response = await backendHttp.get<BackendUser>(
    ME_PATH,
    withToken(idToken),
  );
  if (response.status === 401) {
    throw new ClientApiError(
      clientText("session.registrationIncomplete"),
      401,
      REGISTRATION_REQUIRED,
    );
  }
  if (response.status !== 200) {
    throw new ClientApiError(
      clientText("session.signInIncomplete"),
      response.status,
      SESSION_REQUIRED,
    );
  }

  // Before the approval check, so a pending applicant's decision notification is in their language too. Only that
  // wording depends on it, so a failed save must not block sign-in.
  await backendHttp
    .put(LANGUAGE_PATH, { language: clientLocale() }, withToken(idToken))
    .catch(() => undefined);

  const user = response.data;
  if (!isApproved(user)) {
    throw new ClientApiError(
      clientText(
        user.status === UserAccountStatus.Rejected
          ? "session.applicationRejected"
          : "session.accountAwaitingApproval",
      ),
      403,
      ACCOUNT_NOT_APPROVED,
    );
  }
  const session = toSession(user, clientEdition());
  if (!session) {
    throw new ClientApiError(
      clientText("session.workspaceNotReady"),
      409,
      SESSION_REQUIRED,
    );
  }
  if (!(await startBackendSession(idToken, rememberMe))) {
    throw new ClientApiError(
      clientText("session.sessionUnavailable"),
      503,
      SESSION_REQUIRED,
    );
  }

  const opened = withRememberedWorkspace(session);
  writeSignedInHint(opened.role, rememberMe);
  saveAccountTypeCookie(opened);
  return opened;
}

/**
 * The signed-in session, read from the API on its own cookie (backendHttp starts one from the Firebase sign-in when
 * the cookie is gone). Null when there is none: signed out, or an account that is no longer approved or has no
 * workspace. Any other failure throws, so a hiccup never reads as signed out.
 */
export async function readSession(): Promise<AppSession | null> {
  const response = await backendHttp.get<BackendUser>(ME_PATH);
  if (response.status === 401) return signedOut();
  const user = requireSuccess(response);
  const session = isApproved(user) ? toSession(user, clientEdition()) : null;
  if (!session) return signedOut();

  const opened = withRememberedWorkspace(session);
  // A session resumed without a sign-in on this page (another tab, an older sign-in) gets its hint back; its
  // lifetime is not known here, so it ends with the browser.
  if (readSignedInHint() !== opened.role) {
    writeSignedInHint(opened.role, false);
  }
  saveAccountTypeCookie(opened);
  return opened;
}

/** Opens `workspace` if the account can, and remembers it for the next sign-in in this browser. */
export async function switchSessionWorkspace(
  workspace: Workspace,
): Promise<AppSession> {
  const session = await readSession();
  if (!session) {
    throw new ClientApiError(clientText("http401"), 401, SESSION_REQUIRED);
  }
  const switched = withWorkspace(session, workspace);
  if (!switched) {
    throw new ClientApiError(
      clientText("session.workspaceNotAvailable"),
      403,
      FORBIDDEN,
    );
  }
  saveLastWorkspace(workspace);
  saveAccountTypeCookie(switched);
  return switched;
}

/** Signing out of the API; the Firebase sign-in is ended by the caller. */
export async function signOut() {
  clearSignedInHint();
  await endBackendSession();
}
