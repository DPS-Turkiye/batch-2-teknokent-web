import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAiFeatures } from "@/lib/api/ai-features";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

describe("fetchAiFeatures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks the backend for the deployment's AI switches", async () => {
    await fetchAiFeatures();

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/ai-features",
    });
  });
});
