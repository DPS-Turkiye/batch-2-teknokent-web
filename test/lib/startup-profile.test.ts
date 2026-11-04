import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendRequest } from "@/lib/server/backend-client";
import { loadStartupContext, StartupContextError } from "@/lib/startup-profile";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

const organization = {
  status: 200,
  data: {
    id: "org-1",
    name: "Kargo AI",
    description: "Rota optimizasyonu",
    sector: "Lojistik",
    maturity: "MVP",
  },
  headers: {},
};

function answer(profile: { status: number; data?: unknown }) {
  vi.mocked(backendRequest).mockImplementation(async (config) =>
    String(config.url).startsWith("/api/organizations/")
      ? organization
      : { headers: {}, data: null, ...profile },
  );
}

describe("loadStartupContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matches on the startup's own sector and stage when no pitch deck was confirmed", async () => {
    answer({ status: 404 });

    const { startup, error } = await loadStartupContext("org-1");

    expect(error).toBeUndefined();
    expect(startup).toMatchObject({
      name: "Kargo AI",
      summary: "Rota optimizasyonu",
      sector: "Lojistik",
      stage: "MVP",
      technologies: [],
      confirmedProfile: false,
    });
  });

  it("prefers the confirmed pitch-deck profile", async () => {
    answer({
      status: 200,
      data: {
        sourceFilename: "deck.pdf",
        profile: {
          startup_summary: "Son mil teslimat",
          sectors: ["Lojistik", "Yapay zekâ"],
          stage: "Pilot",
          technologies: ["Python"],
        },
      },
    });

    const { startup } = await loadStartupContext("org-1");

    expect(startup).toMatchObject({
      summary: "Son mil teslimat",
      sector: "Lojistik, Yapay zekâ",
      stage: "Pilot",
      technologies: ["Python"],
      confirmedProfile: true,
    });
  });

  it("still says so when the profile service is down", async () => {
    answer({ status: 503 });

    const { startup, error } = await loadStartupContext("org-1");

    expect(error).toBe(StartupContextError.ProfileUnavailable);
    expect(startup.sector).toBe("Lojistik");
  });
});
