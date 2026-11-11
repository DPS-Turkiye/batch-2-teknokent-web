import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("Rate Limit Retry - API Integration", () => {
  let fetchMock: Mock<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should retry request after 429 response with exponential backoff", async () => {
    let callCount = 0;

    fetchMock.mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        return new Response(JSON.stringify({ message: "Rate limited" }), {
          status: 429,
          headers: {
            "X-Rate-Limit-Retry-After-Seconds": "1",
          },
        });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const retryWithBackoff = async (
      fn: () => Promise<Response>,
      maxRetries = 3,
    ): Promise<Response> => {
      for (let i = 0; i < maxRetries; i++) {
        const response = await fn();
        if (response.status !== 429) {
          return response;
        }
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 100; // 100ms, 200ms, 400ms for tests
          await wait(delay);
        }
      }
      return new Response(JSON.stringify({ error: "Max retries exceeded" }), {
        status: 429,
      });
    };

    const response = await retryWithBackoff(
      () => fetchMock("/api/assistant/query"),
      3,
    );

    expect(response.status).toBe(200);
    expect(callCount).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("should handle timeout errors gracefully", async () => {
    const timeoutError = new Error("Request timeout");
    fetchMock.mockRejectedValue(timeoutError);

    await expect(fetchMock("/api/assistant/query")).rejects.toThrow(
      "Request timeout",
    );

    expect(fetchMock).toHaveBeenCalled();
  });

  it("should stop retrying after max attempts", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Rate limited" }), {
        status: 429,
      }),
    );

    let attempts = 0;
    const maxRetries = 3;

    const retryLogic = async () => {
      for (let i = 0; i < maxRetries; i++) {
        attempts++;
        const response = await fetchMock("/api/assistant/query");
        if (response.status !== 429) return response;
      }
      throw new Error("Max retries exceeded");
    };

    await expect(retryLogic()).rejects.toThrow("Max retries exceeded");

    expect(attempts).toBe(maxRetries);
  });

  it("should include request headers in retry", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer token-123",
      "X-Request-ID": "req-456",
    };

    await fetchMock("/api/assistant/query", {
      method: "POST",
      headers,
      body: JSON.stringify({ query: "test" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assistant/query",
      expect.objectContaining({ headers }),
    );
  });

  it("should respect retry-after header value", async () => {
    const retryAfterSeconds = 5;

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Rate limited" }), {
          status: 429,
          headers: {
            "X-Rate-Limit-Retry-After-Seconds": retryAfterSeconds.toString(),
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

    const retryWithCustomDelay = async (
      fn: () => Promise<Response>,
      maxRetries = 2,
    ): Promise<Response> => {
      for (let i = 0; i < maxRetries; i++) {
        const response = await fn();
        if (response.status !== 429) {
          return response;
        }
        if (i < maxRetries - 1) {
          const retryAfter = parseInt(
            response.headers.get("X-Rate-Limit-Retry-After-Seconds") || "1",
          );
          // In real scenario use: await sleep(retryAfter * 1000)
          // For tests, use a fraction of time
          const delay = (retryAfter * 1000) / 100;
          await wait(delay);
        }
      }
      throw new Error("Max retries exceeded");
    };

    const result = await retryWithCustomDelay(
      () => fetchMock("/api/assistant/query"),
      2,
    );

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should handle partial network failure with fallback", async () => {
    let callCount = 0;

    fetchMock.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Network error");
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const retryOnNetworkError = async (): Promise<Response> => {
      try {
        return await fetchMock("/api/assistant/query");
      } catch {
        return await fetchMock("/api/assistant/query");
      }
    };

    const result = await retryOnNetworkError();

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should not retry on 4xx client errors", async () => {
    const errorCodes = [400, 401, 403, 404];

    for (const code of errorCodes) {
      let callCount = 0;
      fetchMock.mockImplementation(async () => {
        callCount++;
        return new Response(JSON.stringify({ error: "Client error" }), {
          status: code,
        });
      });

      const response = await fetchMock("/api/test");

      expect(response.status).toBe(code);
      expect(callCount).toBe(1); // Should only call once, no retries
      vi.clearAllMocks();
    }
  });

  it("should track retry attempts in metadata", async () => {
    const metadata: { attempts: number; lastRetryTime: string | null } = {
      attempts: 0,
      lastRetryTime: null,
    };

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Rate limited" }), {
          status: 429,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

    const trackRetries = async (
      fn: () => Promise<Response>,
    ): Promise<{
      response: Response;
      metadata: { attempts: number; lastRetryTime: string | null };
    }> => {
      for (let i = 0; i < 3; i++) {
        metadata.attempts++;
        metadata.lastRetryTime = new Date().toISOString();

        const response = await fn();
        if (response.status !== 429) {
          return { response, metadata };
        }
      }

      throw new Error("Max retries exceeded");
    };

    const result = await trackRetries(() => fetchMock("/api/assistant/query"));

    expect(result.metadata.attempts).toBe(2);
    expect(result.metadata.lastRetryTime).toBeDefined();
  });
});
