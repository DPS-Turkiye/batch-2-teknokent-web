import {
  OnboardingDraftKind,
  type OnboardingDraftRecord,
} from "@/interfaces/onboarding-draft";

export const INVITE_PATH = "/invite";
/** The backend's cap on a code (`RegisterMemberRequest`); a longer value from a URL or storage is not a code. */
export const INVITE_CODE_MAX_LENGTH = 32;

const STORAGE_KEY = "menton.inviteIntent";
/**
 * Long enough for a verification e-mail opened days later; short enough that on a shared computer a stale code
 * does not keep sending the next person's sign-in to /invite.
 */
const INTENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteIntent = { code: string; savedAt: number };

/** A code from a URL or storage, trimmed, or null when it cannot be one. */
export function inviteCodeOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return code && code.length <= INVITE_CODE_MAX_LENGTH ? code : null;
}

/** /invite with the code filled in; `resume` marks a return after verification or a later sign-in. */
export function inviteHref(code: string, resume = false) {
  const params = new URLSearchParams({ code });
  if (resume) params.set("resume", "1");
  return `${INVITE_PATH}?${params.toString()}`;
}

/** The link a founder shares with their team. */
export function inviteLink(origin: string, code: string) {
  return `${origin}${inviteHref(code)}`;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Remembered in this browser once a code has been accepted, so someone who leaves to verify their e-mail is sent
 * back to /invite at their next sign-in rather than to the founder and mentor sign-up. Nothing personal is kept.
 */
export function saveInviteIntent(code: string, now = Date.now()) {
  try {
    storage()?.setItem(
      STORAGE_KEY,
      JSON.stringify({ code, savedAt: now } satisfies InviteIntent),
    );
  } catch {
    // Storage full or blocked: the join still works in this tab, only the later return is lost.
  }
}

export function readInviteIntent(now = Date.now()): InviteIntent | null {
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const code = inviteCodeOrNull("code" in parsed ? parsed.code : null);
  const savedAt = "savedAt" in parsed ? parsed.savedAt : null;
  if (!code || typeof savedAt !== "number" || now - savedAt > INTENT_MAX_AGE_MS)
    return null;
  return { code, savedAt };
}

export function clearInviteIntent() {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: a stale intent expires on its own.
  }
}

/**
 * Whether a login without an account goes back to /invite rather than to a saved wizard. A mentor's draft belongs
 * to an account that already exists, so it always wins; a founder draft wins only when it was touched after the
 * code was entered (the person changed their mind and started their own startup).
 */
export function inviteIntentWins(
  intent: InviteIntent | null,
  draft: OnboardingDraftRecord | null,
): intent is InviteIntent {
  if (!intent) return false;
  if (!draft) return true;
  if (draft.kind === OnboardingDraftKind.MentorOnboarding) return false;
  const draftTime = draft.updatedAt ? Date.parse(draft.updatedAt) : NaN;
  return Number.isNaN(draftTime) || intent.savedAt >= draftTime;
}
