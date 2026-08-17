import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BACKEND_URL,
  DEFAULT_BACKEND_URL,
  getBackendHealthUrl,
  getBackendUrl,
} from "@/lib/const";
import {
  fetchBackendHealth,
  fetchHealthClient,
  HEALTH_API_PATH,
  HealthFetchError,
  HealthStatus,
  healthKeys,
  isHealthUp,
  isValidHealthResponse,
} from "@/lib/health";
import { httpClient } from "@/lib/http-client";
import {
  createAxiosResponse,
  healthyResponse,
  unhealthyResponse,
} from "@test/fixtures/health";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

describe("health lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validators", () => {
    it("validates a correct health response shape", () => {
      expect(isValidHealthResponse(healthyResponse)).toBe(true);
      expect(isValidHealthResponse(unhealthyResponse)).toBe(true);
    });

    it("rejects invalid health response shapes", () => {
      expect(isValidHealthResponse(null)).toBe(false);
      expect(isValidHealthResponse({ status: HealthStatus.UP })).toBe(false);
      expect(
        isValidHealthResponse({
          ...healthyResponse,
          components: { database: "UNKNOWN" },
        }),
      ).toBe(false);
    });

    it("detects whether health is up", () => {
      expect(isHealthUp(healthyResponse)).toBe(true);
      expect(isHealthUp(unhealthyResponse)).toBe(false);
    });
  });

  describe("healthKeys", () => {
    it("builds stable query keys", () => {
      expect(healthKeys.all).toEqual(["health"]);
      expect(healthKeys.status()).toEqual(["health", "status"]);
    });
  });

  describe("fetchBackendHealth", () => {
    it("fetches health data from the configured backend URL", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse(healthyResponse, 200),
      );

      const result = await fetchBackendHealth();

      expect(httpClient.get).toHaveBeenCalledWith(getBackendHealthUrl(), {
        validateStatus: expect.any(Function),
      });
      expect(result).toEqual({
        data: healthyResponse,
        httpStatus: 200,
      });
    });

    it("returns backend payload even when status is service unavailable", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse(unhealthyResponse, 503),
      );

      const result = await fetchBackendHealth();

      expect(result.httpStatus).toBe(503);
      expect(result.data).toEqual(unhealthyResponse);
    });

    it("throws HealthFetchError when the network request fails", async () => {
      vi.mocked(httpClient.get).mockRejectedValue(new Error("network down"));

      await expect(fetchBackendHealth()).rejects.toMatchObject({
        name: "HealthFetchError",
        message: "Backend health check request failed",
      });
    });

    it("throws HealthFetchError when the payload shape is invalid", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse({ status: "MAYBE" }, 200),
      );

      await expect(fetchBackendHealth()).rejects.toMatchObject({
        message: "Backend health response has an invalid shape",
      });
    });

    it("rethrows HealthFetchError from response parsing", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse(null, 200),
      );

      await expect(fetchBackendHealth()).rejects.toBeInstanceOf(
        HealthFetchError,
      );
    });
  });

  describe("fetchHealthClient", () => {
    it("fetches health data from the Next.js API route", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse(healthyResponse, 200),
      );

      const result = await fetchHealthClient();

      expect(httpClient.get).toHaveBeenCalledWith(HEALTH_API_PATH, {
        validateStatus: expect.any(Function),
      });
      expect(result).toEqual(healthyResponse);
    });

    it("returns health payload when API responds with service unavailable", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse(unhealthyResponse, 503),
      );

      const result = await fetchHealthClient();

      expect(result).toEqual(unhealthyResponse);
    });

    it("throws HealthFetchError when the request fails", async () => {
      vi.mocked(httpClient.get).mockRejectedValue(new Error("network down"));

      await expect(fetchHealthClient()).rejects.toMatchObject({
        name: "HealthFetchError",
        message: "Health API request failed",
      });
    });

    it("throws HealthFetchError when the payload shape is invalid", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse({ ok: true }, 200),
      );

      await expect(fetchHealthClient()).rejects.toMatchObject({
        message: "Health API response has an invalid shape",
      });
    });

    it("rethrows HealthFetchError from response parsing", async () => {
      vi.mocked(httpClient.get).mockResolvedValue(
        createAxiosResponse(null, 200),
      );

      await expect(fetchHealthClient()).rejects.toBeInstanceOf(
        HealthFetchError,
      );
    });
  });

  describe("constants", () => {
    it("builds backend health URL without trailing slash", () => {
      expect(getBackendUrl()).not.toMatch(/\/$/);
      expect(getBackendHealthUrl()).toBe(`${getBackendUrl()}/api/health`);
    });

    it("falls back to localhost defaults when env is missing", () => {
      expect(BACKEND_URL).toBe(DEFAULT_BACKEND_URL);
    });
  });
});
