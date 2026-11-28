import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useProfileRedirect,
  useStartupPageGate,
} from "@/hooks/use-individual-program";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getOrganizationPrograms } from "@/lib/client/programs";
import { STUDENT_PROJECT_HREF } from "@/lib/startup-tabs";
import { appSession } from "@test/fixtures/session";
import { createTestQueryClient } from "@test/test-utils";

const replace = vi.fn();
let current: { session: AppSession | null; isLoading: boolean } = {
  session: null,
  isLoading: true,
};

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => current,
  useAppSession: () => current.session,
}));
vi.mock("@/lib/client/programs", () => ({ getOrganizationPrograms: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const member = appSession({ role: UserRole.Mentee, organizationId: "org-1" });

function programs(individualMentees: boolean) {
  vi.mocked(getOrganizationPrograms).mockResolvedValue({
    programs: [
      { id: "p-1", name: "p", coordinatorName: "Elif", individualMentees },
    ],
    activeProgramId: "p-1",
  });
}

describe("startup page gate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("holds the page while the session is loading, sending nobody anywhere", () => {
    current = { session: null, isLoading: true };
    const { result } = renderHook(
      () =>
        useStartupPageGate({ strict: true, path: "/startup/profile-tools" }),
      { wrapper },
    );
    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("lets a startup member in once their program is known", async () => {
    current = { session: member, isLoading: false };
    programs(false);
    const { result } = renderHook(
      () => useStartupPageGate({ strict: false, path: "" }),
      { wrapper },
    );
    await waitFor(() => expect(result.current).toBe(true));
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a student of an individual program to Projem", async () => {
    current = { session: member, isLoading: false };
    programs(true);
    const { result } = renderHook(
      () => useStartupPageGate({ strict: false, path: "" }),
      { wrapper },
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(STUDENT_PROJECT_HREF),
    );
    expect(result.current).toBe(false);
  });

  it("sends someone signed out from a strict page to the login", async () => {
    current = { session: null, isLoading: false };
    renderHook(
      () =>
        useStartupPageGate({ strict: true, path: "/startup/profile-tools" }),
      { wrapper },
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/login?next=%2Fstartup%2Fprofile-tools",
      ),
    );
  });

  it("leads /profile on to a startup member's profile tools", async () => {
    current = { session: member, isLoading: false };
    programs(false);
    renderHook(() => useProfileRedirect(true), { wrapper });
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/startup/profile-tools?web=1"),
    );
  });
});
