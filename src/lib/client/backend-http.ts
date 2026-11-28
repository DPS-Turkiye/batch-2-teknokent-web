import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

import { requireSuccess } from "@/lib/client/api";
import { getPublicBackendUrl } from "@/lib/const";
import { currentFirebaseUid, currentIdToken } from "@/lib/firebase/auth";
import { REQUEST_TIMEOUT_MS, toTransportError } from "@/lib/http-client";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    /** Already sent again once after starting a session; a second 401 is the answer. */
    sessionRetried?: boolean;
  }
}

const SESSION_PATH = "/api/auth/session";

/**
 * Calls the backend straight from the browser on the API's own session cookie (HttpOnly: this code never sees
 * it). The backend takes who is calling from that cookie alone, so nothing sent here names the caller; ids in a
 * path only say which of the caller's own things is meant, and the backend refuses any that are not theirs.
 *
 * A call answered 401 starts a session from the tab's Firebase sign-in and is sent once more, so a person who
 * signed in before sessions existed carries on without signing in again.
 */
export const backendHttp = axios.create({
  headers: { Accept: "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
  validateStatus: () => true,
  withCredentials: true,
});

backendHttp.interceptors.request.use((config) => {
  config.baseURL = getPublicBackendUrl();
  return config;
});

backendHttp.interceptors.response.use(async (response: AxiosResponse) => {
  const config = response.config;
  if (
    response.status !== 401 ||
    config.sessionRetried ||
    config.headers.has("Authorization") ||
    !(await resumeSession())
  ) {
    return response;
  }
  config.sessionRetried = true;
  return backendHttp.request(config);
}, toTransportError);

/** Request options carrying a Firebase token the caller already has (onboarding, before any session exists). */
export function withToken(idToken?: string): AxiosRequestConfig | undefined {
  return idToken
    ? { headers: { Authorization: `Bearer ${idToken}` } }
    : undefined;
}

/**
 * Trades a Firebase sign-in for the API's session cookie. `remember` keeps the cookie after the browser closes,
 * as "beni hatırla" does for the sign-in. False when the backend refuses it.
 */
export async function startBackendSession(idToken: string, remember = false) {
  const response = await backendHttp.post(
    SESSION_PATH,
    { remember },
    withToken(idToken),
  );
  return response.status >= 200 && response.status < 300;
}

/** Signing out: drops the API's session cookie. A failure leaves nothing to undo, so it is not reported. */
export async function endBackendSession() {
  await backendHttp.delete(SESSION_PATH).catch(() => undefined);
}

let resuming: Promise<boolean> | null = null;

/** One session start for every call that hit a 401 at the same time. */
function resumeSession(): Promise<boolean> {
  resuming ??= (async () => {
    const idToken = await currentIdToken();
    return idToken ? startBackendSession(idToken) : false;
  })().finally(() => {
    resuming = null;
  });
  return resuming;
}

let ownAccount: { uid: string; id: Promise<string> } | null = null;

/**
 * The signed-in person's account id, for paths that name their own things (/api/mentors/{id}/...). It is asked
 * of the backend once per Firebase login; a failed ask is not kept.
 */
export async function signedInUserId(idToken?: string): Promise<string> {
  const uid = await currentFirebaseUid();
  if (uid && ownAccount?.uid === uid) return ownAccount.id;

  const id = backendHttp
    .get<{ id: string }>("/api/auth/me", withToken(idToken))
    .then((response) => requireSuccess(response).id);
  if (uid) {
    const entry = { uid, id };
    ownAccount = entry;
    id.catch(() => {
      if (ownAccount === entry) ownAccount = null;
    });
  }
  return id;
}
