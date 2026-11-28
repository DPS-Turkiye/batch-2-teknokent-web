import { requireSuccess } from "@/lib/client/api";
import { backendHttp, withToken } from "@/lib/client/backend-http";

/** The backend mails the address in the token, so a caller can only mail themselves. */
export async function requestVerificationEmail(idToken: string) {
  requireSuccess(
    await backendHttp.post(
      "/api/auth/register/verification-email",
      undefined,
      withToken(idToken),
    ),
  );
}

/** "Şifremi unuttum", signed out; the backend answers the same for known and unknown addresses. */
export async function requestPasswordResetEmail(email: string) {
  requireSuccess(
    await backendHttp.post("/api/auth/password-reset", {
      email: email.trim(),
    }),
  );
}
