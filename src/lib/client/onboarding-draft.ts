import type {
  OnboardingDraftKind,
  OnboardingDraftRecord,
} from "@/interfaces/onboarding-draft";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

function bearer(idToken: string) {
  return { headers: { Authorization: `Bearer ${idToken}` } };
}

export async function fetchOnboardingDraft(
  idToken: string,
): Promise<OnboardingDraftRecord | null> {
  const response = await httpClient.get<OnboardingDraftRecord>(
    "/api/onboarding/draft",
    bearer(idToken),
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
    await httpClient.put<OnboardingDraftRecord>(
      "/api/onboarding/draft",
      draft,
      bearer(idToken),
    ),
  );
}

export async function clearOnboardingDraft(idToken: string) {
  const response = await httpClient.delete(
    "/api/onboarding/draft",
    bearer(idToken),
  );
  if (response.status === 204 || response.status === 404) return;
  requireSuccess(response);
}
