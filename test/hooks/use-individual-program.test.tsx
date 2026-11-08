import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useIndividualProgram } from "@/hooks/use-individual-program";
import { UserRole } from "@/interfaces/session";
import { getOrganizationPrograms } from "@/lib/client/programs";
import { createTestQueryClient } from "@test/test-utils";

const mockUseAppSession = vi.fn();

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockUseAppSession(),
}));

vi.mock("@/lib/client/programs", () => ({
  getOrganizationPrograms: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function signedInAs(
  role: UserRole,
  organizationId?: string,
  individualMentee?: boolean,
) {
  mockUseAppSession.mockReturnValue({ role, organizationId, individualMentee });
}

const program = (id: string, individualMentees: boolean) => ({
  id,
  name: id,
  coordinatorName: "Elif",
  individualMentees,
});

describe("useIndividualProgram", () => {
  beforeEach(() => vi.mocked(getOrganizationPrograms).mockReset());

  it("waits for the session before deciding which workspace to show", () => {
    mockUseAppSession.mockReturnValue(null);
    const { result } = renderHook(() => useIndividualProgram(), { wrapper });
    expect(result.current).toEqual({
      individual: false,
      isLoading: true,
      programId: null,
    });
    expect(getOrganizationPrograms).not.toHaveBeenCalled();
  });

  it("is true when the mentee's active program takes individuals", async () => {
    signedInAs(UserRole.Mentee, "org-1");
    vi.mocked(getOrganizationPrograms).mockResolvedValue({
      programs: [program("growth", false), program("iskur", true)],
      activeProgramId: "iskur",
    });
    const { result } = renderHook(() => useIndividualProgram(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.individual).toBe(true);
    expect(result.current.programId).toBe("iskur");
  });

  it("answers from the session's sign-in flag until the programs load", async () => {
    signedInAs(UserRole.Mentee, "org-1", true);
    vi.mocked(getOrganizationPrograms).mockResolvedValue({
      programs: [program("growth", false)],
      activeProgramId: "growth",
    });
    const { result } = renderHook(() => useIndividualProgram(), { wrapper });

    expect(result.current).toEqual({
      individual: true,
      isLoading: false,
      programId: null,
    });
    await waitFor(() => expect(result.current.programId).toBe("growth"));
    expect(result.current.individual).toBe(false);
  });

  it("follows the active program, not any program", async () => {
    signedInAs(UserRole.Mentee, "org-1");
    vi.mocked(getOrganizationPrograms).mockResolvedValue({
      programs: [program("growth", false), program("iskur", true)],
      activeProgramId: "growth",
    });
    const { result } = renderHook(() => useIndividualProgram(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.individual).toBe(false);
  });

  it("never asks for programs outside a mentee with a team", () => {
    signedInAs(UserRole.Mentor);
    const mentor = renderHook(() => useIndividualProgram(), { wrapper });
    signedInAs(UserRole.Mentee);
    const teamless = renderHook(() => useIndividualProgram(), { wrapper });

    expect(mentor.result.current).toEqual({
      individual: false,
      isLoading: false,
      programId: null,
    });
    expect(teamless.result.current).toEqual({
      individual: false,
      isLoading: false,
      programId: null,
    });
    expect(getOrganizationPrograms).not.toHaveBeenCalled();
  });
});
