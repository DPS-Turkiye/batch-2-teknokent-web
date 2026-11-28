import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingDraftKind } from "@/interfaces/onboarding-draft";
import { backendHttp } from "@/lib/client/backend-http";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

// Onboarding runs before any session exists: every call carries the Firebase token it is given.
const TOKEN = { headers: { Authorization: "Bearer id-token" } };
const draft = {
  kind: OnboardingDraftKind.MentorOnboarding,
  step: "3",
  payload: { expertise: ["Finans"] },
};

const calls: ClientCall[] = [
  {
    title: "fetchOnboardingDraft reads the token's own draft",
    call: () => fetchOnboardingDraft("id-token"),
    method: "get",
    args: ["/api/onboarding/draft", TOKEN],
  },
  {
    title: "saveOnboardingDraft saves the draft with the token",
    call: () => saveOnboardingDraft("id-token", draft),
    method: "put",
    args: ["/api/onboarding/draft", draft, TOKEN],
  },
  {
    title: "clearOnboardingDraft deletes the token's own draft",
    call: () => clearOnboardingDraft("id-token"),
    method: "delete",
    args: ["/api/onboarding/draft", TOKEN],
    returnsNothing: true,
  },
];

describe("onboarding draft client", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(calls, backendHttp);

  it.each([204, 404])("reads %s as no draft", async (status) => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createMentorResponse("", status),
    );

    await expect(fetchOnboardingDraft("id-token")).resolves.toBeNull();
  });

  it.each([204, 404])("treats %s as already cleared", async (status) => {
    vi.mocked(backendHttp.delete).mockResolvedValue(
      createMentorResponse("", status),
    );

    await expect(clearOnboardingDraft("id-token")).resolves.toBeUndefined();
  });
});
