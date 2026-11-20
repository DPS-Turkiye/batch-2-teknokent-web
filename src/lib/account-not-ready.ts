import {
  OnboardingDraftKind,
  type OnboardingDraftRecord,
} from "@/interfaces/onboarding-draft";
import {
  UserAccountStatus,
  UserRole,
  type BackendUser,
} from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import { ACCOUNT_NOT_APPROVED, REGISTRATION_REQUIRED } from "@/lib/const";
import {
  inviteHref,
  inviteIntentWins,
  readInviteIntent,
} from "@/lib/invite-intent";
import { signupResumeHref } from "@/lib/signup-resume";

export const APPLICATION_STATUS_HREF = "/application-status";

/**
 * A founder's account is created by the wizard's final submit, so once the account exists a founder draft is
 * a leftover, not a half-finished signup. A mentor's account exists from the first step, so their draft is real.
 */
export function isStaleDraft(draft: OnboardingDraftRecord | null) {
  return draft?.kind === OnboardingDraftKind.SignupWizard;
}

/** Drops a founder draft left behind for an account that now exists; a mentor's draft is kept. */
export async function clearStaleDraft(idToken: string) {
  const draft = await fetchOnboardingDraft(idToken).catch(() => null);
  if (isStaleDraft(draft)) {
    await clearOnboardingDraft(idToken).catch(() => undefined);
  }
}

/**
 * Where someone who already has an account goes from the founder wizard: sign in, or their status page while
 * they wait. A mentor signs in either way: a pending mentor's sign-in is what returns them to their onboarding.
 */
export function existingAccountHref(
  account: Pick<BackendUser, "role" | "status"> | null,
) {
  if (!account || account.role === UserRole.Mentor) return "/login";
  return account.status === UserAccountStatus.Pending ||
    account.status === UserAccountStatus.Rejected
    ? APPLICATION_STATUS_HREF
    : "/login";
}

/**
 * Where a sign-in goes when the account isn't ready: a pending account to its status page (a mentor still in
 * onboarding back to it), a half-registered one to its saved signup, a login that entered a team code in this
 * browser back to /invite, any other login without an account to the ordinary signup. The Firebase session is
 * kept. Null when the error is anything else.
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
  const draft = idToken
    ? await fetchOnboardingDraft(idToken).catch(() => null)
    : null;
  if (error.code === REGISTRATION_REQUIRED) {
    const intent = readInviteIntent();
    return inviteIntentWins(intent, draft)
      ? inviteHref(intent.code, true)
      : signupResumeHref(draft?.kind);
  }
  // Resuming a founder wizard for an account that exists only loops: the wizard sends them back to sign in.
  if (draft && !isStaleDraft(draft)) return signupResumeHref(draft.kind);
  if (draft && idToken) {
    await clearOnboardingDraft(idToken).catch(() => undefined);
  }
  return APPLICATION_STATUS_HREF;
}
