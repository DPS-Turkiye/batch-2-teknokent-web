import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDemoAccounts } from "@/hooks/use-demo-accounts";
import { UserRole } from "@/interfaces/session";
import { httpClient } from "@/lib/http-client";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn() },
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useDemoAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to fetching mentee accounts", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: [],
      status: 200,
      headers: {},
      statusText: "OK",
      config: {},
    });

    const { result } = renderHook(() => useDemoAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(httpClient.get).toHaveBeenCalledWith("/api/demo-accounts", {
      params: { role: UserRole.Mentee },
    });
  });

  it("fetches mentor accounts when requested", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: [],
      status: 200,
      headers: {},
      statusText: "OK",
      config: {},
    });

    const { result } = renderHook(() => useDemoAccounts(UserRole.Mentor), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(httpClient.get).toHaveBeenCalledWith("/api/demo-accounts", {
      params: { role: UserRole.Mentor },
    });
  });

  it("throws when the response is not an array", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { message: "nope" },
      status: 200,
      headers: {},
      statusText: "OK",
      config: {},
    });

    const { result } = renderHook(() => useDemoAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
