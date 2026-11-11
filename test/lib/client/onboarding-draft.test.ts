import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("onboarding draft client", () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(httpClient.put).mockReset();
    vi.mocked(httpClient.delete).mockReset();
  });

  it("returns null when nothing is stored", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 204,
      data: "",
    });

    await expect(fetchOnboardingDraft("id-token")).resolves.toBeNull();
  });

  it("returns the stored draft", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: { kind: "signup-wizard", step: "2", payload: { bio: "Kurucu" } },
    });

    await expect(fetchOnboardingDraft("id-token")).resolves.toEqual({
      kind: "signup-wizard",
      step: "2",
      payload: { bio: "Kurucu" },
    });
    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/onboarding/draft",
      expect.objectContaining({
        headers: { Authorization: "Bearer id-token" },
      }),
    );
  });

  it("saves the draft", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({
      status: 200,
      data: { kind: "mentor-onboarding", step: "3", payload: {} },
    });

    await saveOnboardingDraft("id-token", {
      kind: "mentor-onboarding",
      step: "3",
      payload: { expertise: ["Finans"] },
    });

    expect(httpClient.put).toHaveBeenCalledWith(
      "/api/onboarding/draft",
      {
        kind: "mentor-onboarding",
        step: "3",
        payload: { expertise: ["Finans"] },
      },
      expect.objectContaining({
        headers: { Authorization: "Bearer id-token" },
      }),
    );
  });

  it("treats a missing draft as already cleared", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue({
      status: 204,
      data: "",
    });

    await expect(clearOnboardingDraft("id-token")).resolves.toBeUndefined();
  });
});
