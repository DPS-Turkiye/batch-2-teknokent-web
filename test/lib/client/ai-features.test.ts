import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAiFeatures } from "@/lib/client/ai-features";
import { ClientApiError } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { aiFeatures } from "@test/fixtures/ai-features";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("getAiFeatures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the switches from the backend", async () => {
    const switches = aiFeatures({ syllabus: false });
    vi.mocked(backendHttp.get).mockResolvedValue(
      createAxiosResponse(switches, 200),
    );

    await expect(getAiFeatures()).resolves.toEqual(switches);
    expect(backendHttp.get).toHaveBeenCalledWith("/api/ai-features");
  });

  it("surfaces a failed read as a ClientApiError", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createAxiosResponse({ message: "x" }, 502),
    );

    await expect(getAiFeatures()).rejects.toBeInstanceOf(ClientApiError);
  });
});
