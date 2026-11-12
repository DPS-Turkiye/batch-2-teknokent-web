import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAiFeatures } from "@/lib/client/ai-features";
import { ClientApiError } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";
import { aiFeatures } from "@test/fixtures/ai-features";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/http-client", () => ({ httpClient: { get: vi.fn() } }));

describe("getAiFeatures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the switches from this app's route", async () => {
    const switches = aiFeatures({ syllabus: false });
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse(switches, 200),
    );

    await expect(getAiFeatures()).resolves.toEqual(switches);
    expect(httpClient.get).toHaveBeenCalledWith("/api/ai-features");
  });

  it("surfaces a failed read as a ClientApiError", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ message: "x" }, 502),
    );

    await expect(getAiFeatures()).rejects.toBeInstanceOf(ClientApiError);
  });
});
