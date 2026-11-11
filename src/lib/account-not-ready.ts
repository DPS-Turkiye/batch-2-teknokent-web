import { ClientApiError } from "@/lib/client/api";
import { fetchOnboardingDraft } from "@/lib/client/onboarding-draft";
import { ACCOUNT_NOT_APPROVED, REGISTRATION_REQUIRED } from "@/lib/const";
import { signupResumeHref } from "@/lib/signup-resume";

/**
 * Where a sign-in goes when the account isn't ready: a pending account to its status page, a half-registered one
 * to its saved signup, a login without an account to the ordinary signup. The Firebase session is kept. Null
 * when the error is anything else.
 */
export async function accountNotReadyHref(
  error: unknown,
  idToken: string | null,
): Promise<string | null> {
  if (
    !(error instanceof ClientApiError) ||
    (error.code !== ACCOUNT_NOT_APPROVED &&
      error.code !== REGISTRATION_REQUIRED)
  ) {
    return null;
  }
  // A signup saved half-way reopens in its wizard; a finished one clears its draft.
  const draft = idToken
    ? await fetchOnboardingDraft(idToken).catch(() => null)
    : null;
  if (draft) return signupResumeHref(draft.kind);
  return error.code === ACCOUNT_NOT_APPROVED
    ? "/application-status"
    : signupResumeHref();
}
