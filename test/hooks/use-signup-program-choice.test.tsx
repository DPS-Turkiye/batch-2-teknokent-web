import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSignupProgramChoice } from "@/hooks/use-signup-program-choice";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { getProgramNames } from "@/lib/client/programs";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/programs", () => ({
  getProgramNames: vi.fn(),
}));

function createQueryWrapper() {
  const client = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function wizardWith(programId: string | null, startupLater = false) {
  return {
    draft: { startup: { programId, startupLater } },
    updateStartup: vi.fn(),
  } as unknown as SignupWizard;
}

describe("useSignupProgramChoice", () => {
  vi.mocked(getProgramNames).mockResolvedValue([
    { id: "bigg", name: "BİGG", individualMentees: false },
    { id: "iskur", name: "İŞKUR", individualMentees: true },
  ]);

  it("skips the startup questions for an individual program", async () => {
    const wizard = wizardWith(null);
    const { result } = renderHook(() => useSignupProgramChoice(wizard), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.options).toHaveLength(2));

    act(() => result.current.choose("İŞKUR"));

    expect(wizard.updateStartup).toHaveBeenCalledWith("programId", "iskur");
    expect(wizard.updateStartup).toHaveBeenCalledWith("startupLater", true);
  });

  it("asks for the startup again when leaving an individual program", async () => {
    const wizard = wizardWith("iskur", true);
    const { result } = renderHook(() => useSignupProgramChoice(wizard), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.individual).toBe(true));
    expect(result.current.selectedName).toBe("İŞKUR");

    act(() => result.current.choose("BİGG"));

    expect(wizard.updateStartup).toHaveBeenCalledWith("programId", "bigg");
    expect(wizard.updateStartup).toHaveBeenCalledWith("startupLater", false);
  });

  it("leaves the founder's own startup-later choice alone between regular programs", async () => {
    const wizard = wizardWith("bigg", true);
    const { result } = renderHook(() => useSignupProgramChoice(wizard), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.options).toHaveLength(2));

    act(() => result.current.choose("BİGG"));

    expect(wizard.updateStartup).toHaveBeenCalledTimes(1);
    expect(result.current.individual).toBe(false);
  });
});
