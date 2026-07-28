import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHealthStatus } from "@/hooks/use-health-status";
import { fetchHealthClient, HealthFetchError } from "@/lib/health";
import { healthyResponse, unhealthyResponse } from "@test/fixtures/health";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/health", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/health")>();

  return {
    ...actual,
    fetchHealthClient: vi.fn(),
  };
});

function createWrapper() {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useHealthStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state", () => {
    vi.mocked(fetchHealthClient).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useHealthStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.health).toBeUndefined();
    expect(result.current.isUp).toBe(false);
  });

  it("returns healthy data when fetch succeeds", async () => {
    vi.mocked(fetchHealthClient).mockResolvedValue(healthyResponse);

    const { result } = renderHook(() => useHealthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.health).toEqual(healthyResponse);
    expect(result.current.isUp).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns unhealthy data without treating it as an error", async () => {
    vi.mocked(fetchHealthClient).mockResolvedValue(unhealthyResponse);

    const { result } = renderHook(() => useHealthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.health).toEqual(unhealthyResponse);
    expect(result.current.isUp).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("exposes error state when fetch fails", async () => {
    vi.mocked(fetchHealthClient).mockRejectedValue(
      new HealthFetchError("Health API request failed"),
    );

    const { result } = renderHook(() => useHealthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.health).toBeUndefined();
    expect(result.current.error).toMatchObject({
      message: "Health API request failed",
    });
  });

  it("supports manual refetch", async () => {
    vi.mocked(fetchHealthClient).mockResolvedValue(healthyResponse);

    const { result } = renderHook(() => useHealthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = vi.mocked(fetchHealthClient).mock.calls.length;

    result.current.refetch();

    await waitFor(() => {
      expect(fetchHealthClient).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });
});
