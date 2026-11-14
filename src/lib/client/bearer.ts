import { clientText } from "@/i18n/client-texts";
import { currentIdToken } from "@/lib/firebase/auth";

/**
 * The signed-in person's own Firebase token, for calls the backend checks
 * against that person. Without one the caller is asked to sign in again.
 */
export async function bearerHeader(signInText?: string) {
  const token = await currentIdToken();
  if (!token) throw new Error(signInText ?? clientText("sessionExpired"));
  return { Authorization: `Bearer ${token}` };
}

/**
 * The token when there is one, else no header: for calls the proxy can also make on its own credentials, where
 * the token only lets the backend count the call against that person.
 */
export async function optionalBearerHeader(): Promise<Record<string, string>> {
  const token = await currentIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
