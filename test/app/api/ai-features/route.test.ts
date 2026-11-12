import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/ai-features/route";
import { fetchAiFeatures } from "@/lib/api/ai-features";
import { aiFeatures } from "@test/fixtures/ai-features";
import { backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/ai-features", () => ({ fetchAiFeatures: vi.fn() }));

describe("GET /api/ai-features", () => {
  beforeEach(() => vi.clearAllMocks());

  it("answers without a session, passing the backend's switches through", async () => {
    const switches = aiFeatures({ profileParsing: false });
    vi.mocked(fetchAiFeatures).mockResolvedValue(backendResponse(switches));

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(switches);
  });

  it("answers 502 with a translated message when the backend cannot be reached", async () => {
    vi.mocked(fetchAiFeatures).mockRejectedValue(new Error("down"));

    const response = await GET();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      message: "Yapay zekâ ayarları yüklenemedi.",
    });
  });
});
