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
