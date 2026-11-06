import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The backend takes the address from the token, so a caller can only mail themselves. */
export function sendVerificationEmail(idToken: string) {
  return backendRequest(
    { method: HttpMethod.Post, url: "/api/auth/register/verification-email" },
    { idToken },
  );
}

export function sendPasswordResetEmail(email: string) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/auth/password-reset",
    data: { email },
  });
}
