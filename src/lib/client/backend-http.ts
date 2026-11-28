import axios, { type AxiosRequestConfig } from "axios";

import { clientText } from "@/i18n/client-texts";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { getPublicBackendUrl } from "@/lib/const";
import { currentFirebaseUid, currentIdToken } from "@/lib/firebase/auth";
import { REQUEST_TIMEOUT_MS, toTransportError } from "@/lib/http-client";

/**
 * Calls the backend straight from the browser, with the signed-in person's own Firebase token. The backend takes
 * who is calling from that token alone, so nothing sent here names the caller; ids in a path only say which of
 * the caller's own things is meant, and the backend refuses any that are not theirs.
 */
export const backendHttp = axios.create({
  headers: { Accept: "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
  validateStatus: () => true,
});

backendHttp.interceptors.request.use(async (config) => {
  config.baseURL = getPublicBackendUrl();
  // A caller that already holds a token (onboarding, right after sign-up) passes it; otherwise the tab's own.
  if (!config.headers.has("Authorization")) {
    const token = await currentIdToken();
    if (!token) throw new ClientApiError(clientText("sessionExpired"), 401);
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

backendHttp.interceptors.response.use(undefined, toTransportError);

/** Request options carrying a token the caller already has, or none to use the tab's own. */
export function withToken(idToken?: string): AxiosRequestConfig | undefined {
  return idToken
    ? { headers: { Authorization: `Bearer ${idToken}` } }
    : undefined;
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
