import type {
  OnboardingDraftKind,
  OnboardingDraftRecord,
} from "@/interfaces/onboarding-draft";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp, withToken } from "@/lib/client/backend-http";

// Onboarding runs before the account is approved (or exists), so it rides on the Firebase token, not a session.
const PATH = "/api/onboarding/draft";

export async function fetchOnboardingDraft(
  idToken: string,
): Promise<OnboardingDraftRecord | null> {
  const response = await backendHttp.get<OnboardingDraftRecord>(
    PATH,
    withToken(idToken),
  );
  if (response.status === 204 || response.status === 404) return null;
  return requireSuccess(response);
}

export async function saveOnboardingDraft(
  idToken: string,
  draft: {
    kind: OnboardingDraftKind;
    step: string;
    payload: unknown;
  },
) {
  return requireSuccess(
    await backendHttp.put<OnboardingDraftRecord>(
      PATH,
      draft,
      withToken(idToken),
    ),
  );
}

export async function clearOnboardingDraft(idToken: string) {
  const response = await backendHttp.delete(PATH, withToken(idToken));
  if (response.status === 204 || response.status === 404) return;
  requireSuccess(response);
}
