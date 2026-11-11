import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OnboardingDraftRecord } from "@/interfaces/onboarding-draft";
import {
  deleteOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/api/onboarding-draft";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("onboarding draft server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("reads the draft signed with the token", async () => {
    await fetchOnboardingDraft("id-token");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      { method: "GET", url: "/api/onboarding/draft" },
      { idToken: "id-token" },
    ]);
  });

  it("saves only the kind, step and payload, leaving the server's timestamp out", async () => {
    const draft: OnboardingDraftRecord = {
      kind: "signup-wizard",
      step: "startup",
      payload: { name: "Orbit" },
      updatedAt: "2026-11-10T08:00:00Z",
    };

    await saveOnboardingDraft("id-token", draft);

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "PUT",
        url: "/api/onboarding/draft",
        data: {
          kind: "signup-wizard",
          step: "startup",
          payload: { name: "Orbit" },
        },
      },
      { idToken: "id-token" },
    ]);
  });

  it("deletes the draft signed with the token", async () => {
    await deleteOnboardingDraft("id-token");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      { method: "DELETE", url: "/api/onboarding/draft" },
      { idToken: "id-token" },
    ]);
  });
});
