import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAccountStatus } from "@/hooks/use-account-status";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { fetchAccountStatus } from "@/lib/client/auth";
import { currentIdToken } from "@/lib/firebase/auth";

vi.mock("@/lib/client/auth", () => ({ fetchAccountStatus: vi.fn() }));
vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe("useAccountStatus", () => {
  it("reports signed-out when Firebase has no current user", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    const { result } = renderHook(() => useAccountStatus(), { wrapper });

    await waitFor(() => expect(result.current.isSignedOut).toBe(true));
    expect(result.current.account).toBeNull();
    expect(fetchAccountStatus).not.toHaveBeenCalled();
  });

  it("fetches the account with the current id token", async () => {
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    vi.mocked(fetchAccountStatus).mockResolvedValue({
      id: "u1",
      email: "gulse@dongu.co",
      fullName: "Gülse Demir",
      role: UserRole.Mentee,
      status: UserAccountStatus.Pending,
    });

    const { result } = renderHook(() => useAccountStatus(), { wrapper });

    await waitFor(() => expect(result.current.account).not.toBeNull());
    expect(fetchAccountStatus).toHaveBeenCalledWith("id-token");
    expect(result.current.account?.status).toBe(UserAccountStatus.Pending);
    expect(result.current.isSignedOut).toBe(false);
  });

  it("does not claim signed-out when the request fails", async () => {
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    vi.mocked(fetchAccountStatus).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useAccountStatus(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.isSignedOut).toBe(false);
  });
});
