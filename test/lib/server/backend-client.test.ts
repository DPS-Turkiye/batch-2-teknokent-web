import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendRequest } from "@/lib/server/backend-client";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("axios", () => ({ default: { request: vi.fn() } }));

describe("backendRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BACKEND_USERNAME", "svc");
    vi.stubEnv("BACKEND_PASSWORD", "secret");
    vi.mocked(axios.request).mockResolvedValue({
      status: 200,
      data: {},
      headers: {},
    });
  });

  it("tells the backend which language the reader uses", async () => {
    await backendRequest({ method: "GET", url: "/api/health" });

    expect(
      itemAt(vi.mocked(axios.request).mock.calls, 0)[0].headers,
    ).toMatchObject({
      "Accept-Language": "tr",
    });
  });
});
