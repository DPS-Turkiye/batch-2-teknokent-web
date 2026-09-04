import "server-only";

import type { OnboardingDraftRecord } from "@/interfaces/onboarding-draft";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchOnboardingDraft(idToken: string) {
  return backendRequest<OnboardingDraftRecord | "">(
    { method: "GET", url: "/api/onboarding/draft" },
    { idToken },
  );
}

export function saveOnboardingDraft(
  idToken: string,
  draft: OnboardingDraftRecord,
) {
  return backendRequest<OnboardingDraftRecord>(
    {
      method: "PUT",
      url: "/api/onboarding/draft",
      data: {
        kind: draft.kind,
        step: draft.step,
        payload: draft.payload,
      },
    },
    { idToken },
  );
}

export function deleteOnboardingDraft(idToken: string) {
  return backendRequest<void>(
    { method: "DELETE", url: "/api/onboarding/draft" },
    { idToken },
  );
}
