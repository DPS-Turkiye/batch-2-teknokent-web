import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function requestVerificationEmail(idToken: string) {
  requireSuccess(
    await httpClient.post("/api/auth/verification-email", undefined, {
      headers: { Authorization: `Bearer ${idToken}` },
    }),
  );
}

export async function requestPasswordResetEmail(email: string) {
  requireSuccess(await httpClient.post("/api/auth/password-reset", { email }));
}
