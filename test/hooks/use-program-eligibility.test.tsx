import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useProgramEligibility,
  useSignupCanContinue,
} from "@/hooks/use-program-eligibility";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { SignupStep } from "@/interfaces/signup";
import { getProgramEligibility } from "@/lib/client/auth";
import { currentIdToken } from "@/lib/firebase/auth";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/auth", () => ({ getProgramEligibility: vi.fn() }));
vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function wizard(step: SignupStep, programId: string | null) {
  return {
    step,
    canContinue: true,
    draft: { startup: { programId } },
  } as unknown as SignupWizard;
}

describe("useProgramEligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentIdToken).mockResolvedValue("token-1");
  });

  it("does not ask before a program is picked", () => {
    const { result } = renderHook(() => useProgramEligibility(null), {
      wrapper,
    });

    expect(result.current).toEqual({
      checking: false,
      refusal: null,
      allowed: true,
    });
    expect(getProgramEligibility).not.toHaveBeenCalled();
  });

  it("gives the backend's reason when the address may not join", async () => {
    vi.mocked(getProgramEligibility).mockResolvedValue({
      eligible: false,
      message: "e2@metu.edu.tr bu programa katılamaz.",
    });
    const { result } = renderHook(() => useProgramEligibility("iskur"), {
      wrapper,
    });

    expect(result.current.checking).toBe(true);
    expect(result.current.allowed).toBe(false);
    await waitFor(() =>
      expect(result.current.refusal).toBe(
        "e2@metu.edu.tr bu programa katılamaz.",
      ),
    );
    expect(result.current.allowed).toBe(false);
    expect(getProgramEligibility).toHaveBeenCalledWith("iskur", "token-1");
  });

  it("lets a listed student through", async () => {
    vi.mocked(getProgramEligibility).mockResolvedValue({
      eligible: true,
      message: null,
    });
    const { result } = renderHook(() => useProgramEligibility("iskur"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.allowed).toBe(true));
    expect(result.current.refusal).toBeNull();
  });

  it("does not block when the check itself fails; submit still refuses", async () => {
    vi.mocked(getProgramEligibility).mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useProgramEligibility("iskur"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(true);
  });
});

describe("useSignupCanContinue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentIdToken).mockResolvedValue("token-1");
    vi.mocked(getProgramEligibility).mockResolvedValue({
      eligible: false,
      message: "Listede değil.",
    });
  });

  it("holds Devam on the program step and at review for a refused program", async () => {
    const program = renderHook(
      () => useSignupCanContinue(wizard(SignupStep.StartupProfile, "iskur")),
      { wrapper },
    );
    const review = renderHook(
      () => useSignupCanContinue(wizard(SignupStep.Review, "iskur")),
      { wrapper },
    );

    await waitFor(() => expect(getProgramEligibility).toHaveBeenCalled());
    expect(program.result.current).toBe(false);
    expect(review.result.current).toBe(false);
  });

  it("leaves the first step to the wizard's own rule", () => {
    const { result } = renderHook(
      () => useSignupCanContinue(wizard(SignupStep.PersonalProfile, "iskur")),
      { wrapper },
    );

    expect(result.current).toBe(true);
  });
});
