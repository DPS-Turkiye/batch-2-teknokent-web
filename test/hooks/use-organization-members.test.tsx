import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useAddOrganizationMember,
  useOrganizationMembers,
} from "@/hooks/use-organization-members";
import {
  addOrganizationMember,
  getOrganizationMembers,
} from "@/lib/client/organization-members";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/organization-members", () => ({
  getOrganizationMembers: vi.fn(),
  addOrganizationMember: vi.fn(),
}));

function wrapperFor(queryClient: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("organization members hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the org's members", async () => {
    vi.mocked(getOrganizationMembers).mockResolvedValue([
      {
        id: "member-1",
        email: "ekip@greenloop.demo",
        fullName: "Ekip Üyesi",
        role: "MENTEE",
        organizationId: "org-1",
        organizationName: "GreenLoop",
      },
    ]);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useOrganizationMembers(), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].fullName).toBe("Ekip Üyesi");
  });

  it("invalidates the members list after adding one", async () => {
    vi.mocked(addOrganizationMember).mockResolvedValue({
      id: "member-2",
      email: "yeni@greenloop.demo",
      fullName: "Yeni Üye",
      role: "MENTEE",
    });
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAddOrganizationMember(), {
      wrapper: wrapperFor(queryClient),
    });

    await result.current.mutateAsync({
      fullName: "Yeni Üye",
      email: "yeni@greenloop.demo",
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["organization-members"],
    });
  });
});
