import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, PUT } from "@/app/api/onboarding/draft/route";
import {
  deleteOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/api/onboarding-draft";

vi.mock("@/lib/api/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn(),
  saveOnboardingDraft: vi.fn(),
  deleteOnboardingDraft: vi.fn(),
}));

function request(options: { method: string; token?: string; body?: unknown }) {
  return {
    method: options.method,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "authorization" && options.token
          ? `Bearer ${options.token}`
          : null,
    },
    json: async () => options.body ?? {},
  } as unknown as NextRequest;
}

describe("/api/onboarding/draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchOnboardingDraft).mockResolvedValue({
      data: { kind: "signup-wizard", step: "1", payload: { bio: "Kurucu" } },
      headers: {},
      status: 200,
    });
    vi.mocked(saveOnboardingDraft).mockResolvedValue({
      data: { kind: "signup-wizard", step: "1", payload: { bio: "Kurucu" } },
      headers: {},
      status: 200,
    });
    vi.mocked(deleteOnboardingDraft).mockResolvedValue({
      data: undefined,
      headers: {},
      status: 204,
    });
  });

  it("rejects GET without a Firebase token", async () => {
    const response = await GET(request({ method: "GET" }));
    expect(response.status).toBe(400);
    expect(fetchOnboardingDraft).not.toHaveBeenCalled();
  });

  it("forwards GET with the Firebase token", async () => {
    const response = await GET(request({ method: "GET", token: "id-token" }));
    expect(response.status).toBe(200);
    expect(fetchOnboardingDraft).toHaveBeenCalledWith("id-token");
  });

  it("forwards PUT with the token and body", async () => {
    await PUT(
      request({
        method: "PUT",
        token: "id-token",
        body: {
          kind: "signup-wizard",
          step: "2",
          payload: { bio: "Kurucu" },
        },
      }),
    );

    expect(saveOnboardingDraft).toHaveBeenCalledWith("id-token", {
      kind: "signup-wizard",
      step: "2",
      payload: { bio: "Kurucu" },
    });
  });

  it("forwards DELETE with the Firebase token", async () => {
    const response = await DELETE(
      request({ method: "DELETE", token: "id-token" }),
    );
    expect(response.status).toBe(204);
    expect(deleteOnboardingDraft).toHaveBeenCalledWith("id-token");
  });
});
