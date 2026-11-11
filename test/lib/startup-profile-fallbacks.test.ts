import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  backendRequest,
  type BackendResponse,
} from "@/lib/server/backend-client";
import { loadStartupContext, StartupContextError } from "@/lib/startup-profile";
import tr from "@/messages/tr.json";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

const organization = {
  id: "org-1",
  name: "Kargo AI",
  description: "  Rota optimizasyonu  ",
  sector: "Lojistik",
  maturity: "MVP",
};

/** The organization and the confirmed-profile endpoints answer with these. */
function answer(
  organizationAnswer: BackendResponse,
  profileAnswer: BackendResponse,
) {
  vi.mocked(backendRequest).mockImplementation(
    async (config: AxiosRequestConfig) =>
      String(config.url).startsWith("/api/organizations/")
        ? organizationAnswer
        : profileAnswer,
  );
}

function ok(data: unknown): BackendResponse {
  return { status: 200, data, headers: {} };
}

describe("loadStartupContext fallbacks", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("asks for the encoded startup and its latest confirmed profile", async () => {
    answer(ok(organization), { status: 404, data: null, headers: {} });

    await loadStartupContext("org/1");

    expect(backendRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/api/organizations/org%2F1",
    });
    expect(backendRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/api/profile-analyses/latest/confirmed",
      params: { organizationId: "org/1" },
    });
  });

  it("reads a profile the backend stored as a JSON string", async () => {
    answer(
      ok(organization),
      ok({
        sourceFilename: "deck.pdf",
        profile: JSON.stringify({
          startup_name: " Kargo ",
          team_size: 4,
          technologies: ["Go", 7, "Rust"],
        }),
      }),
    );

    const { startup, error } = await loadStartupContext("org-1");

    expect(error).toBeUndefined();
    expect(startup).toEqual({
      organizationId: "org-1",
      name: "Kargo",
      summary: "Rota optimizasyonu",
      sector: "Lojistik",
      stage: "MVP",
      teamSize: 4,
      technologies: ["Go", "Rust"],
      confirmedProfile: true,
      sourceFilename: "deck.pdf",
    });
  });

  it.each([
    ["broken JSON", "{not json"],
    ["a JSON list", "[1, 2]"],
    ["a list", ["a"]],
    ["a number", 42],
  ])(
    "falls back to the signup details when the profile is %s",
    async (_label, profile) => {
      answer(ok(organization), ok({ profile }));

      const { startup } = await loadStartupContext("org-1");

      expect(startup).toMatchObject({
        name: "Kargo AI",
        sector: "Lojistik",
        stage: "MVP",
        technologies: [],
        confirmedProfile: true,
      });
      expect(startup.teamSize).toBeUndefined();
    },
  );

  it("leaves the summary empty when neither the profile nor the startup has one", async () => {
    answer(ok({ id: "org-1", name: "Kargo AI", description: null }), ok({}));

    const { startup } = await loadStartupContext("org-1");

    expect(startup.summary).toBe("");
    expect(startup.sector).toBe("");
    expect(startup.stage).toBe("");
  });

  it("answers a named placeholder and the failure when the startup itself cannot be read", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    answer({ status: 500, data: null, headers: {} }, ok({}));

    const { startup, error } = await loadStartupContext("org-1");

    expect(error).toBe(StartupContextError.Failed);
    expect(startup).toEqual({
      organizationId: "org-1",
      name: tr.loadErrors.startupFallbackName,
      summary: "",
      sector: "",
      stage: "",
      technologies: [],
      confirmedProfile: false,
    });
    expect(logged).toHaveBeenCalledWith(
      "Startup context failed to load",
      expect.any(Error),
    );
  });
});
