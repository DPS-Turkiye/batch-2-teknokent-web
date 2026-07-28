import { describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";
import { fetchBackendHealth, HealthFetchError } from "@/lib/health";
import { healthyResponse, unhealthyResponse } from "@test/fixtures/health";

vi.mock("@/lib/health", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/health")>();

  return {
    ...actual,
    fetchBackendHealth: vi.fn(),
  };
});

describe("GET /api/health", () => {
  it("returns backend health payload with matching status code", async () => {
    vi.mocked(fetchBackendHealth).mockResolvedValue({
      data: healthyResponse,
      httpStatus: 200,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(healthyResponse);
  });

  it("proxies service unavailable responses from backend", async () => {
    vi.mocked(fetchBackendHealth).mockResolvedValue({
      data: unhealthyResponse,
      httpStatus: 503,
    });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual(unhealthyResponse);
  });

  it("returns 502 when backend health fetch fails", async () => {
    vi.mocked(fetchBackendHealth).mockRejectedValue(
      new HealthFetchError("Backend health check request failed"),
    );

    const response = await GET();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: "Backend health check request failed",
    });
  });

  it("returns 500 for unexpected errors", async () => {
    vi.mocked(fetchBackendHealth).mockRejectedValue(new Error("boom"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unexpected health check failure",
    });
  });
});
