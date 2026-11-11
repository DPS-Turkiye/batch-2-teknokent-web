import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatures } from "@/hooks/use-ai-features";
import { useSignupCv } from "@/hooks/use-signup-cv";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { parseCv } from "@/lib/client/profile-analysis";
import { aiFeatures } from "@test/fixtures/ai-features";
import { signupDraft, signupWizardStub } from "@test/fixtures/signup-wizard";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-ai-features", () => ({ useAiFeatures: vi.fn() }));
vi.mock("@/lib/client/profile-analysis", () => ({
  parseCv: vi.fn(),
  parseStoredCv: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const file = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
const upload = { name: file.name, size: 4, file };

function wizardWith(role = "") {
  const updatePersonal = vi.fn<SignupWizard["updatePersonal"]>();
  const wizard = signupWizardStub({
    draft: signupDraft({ personal: { role, bio: "" } }),
    updatePersonal,
  });
  return { wizard, updatePersonal };
}

describe("useSignupCv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiFeatures).mockReturnValue(aiFeatures());
  });

  it("keeps the CV and suggests the role and bio from it", async () => {
    vi.mocked(parseCv).mockResolvedValue({
      current_role: "Ürün Yöneticisi",
      professional_summary: "Ürün geliştiriyorum.",
    });
    const { wizard, updatePersonal } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.choose(upload));

    expect(updatePersonal).toHaveBeenCalledWith("cv", upload);
    await waitFor(() =>
      expect(updatePersonal).toHaveBeenCalledWith("role", "Ürün Yöneticisi"),
    );
    expect(updatePersonal).toHaveBeenCalledWith("bio", "Ürün geliştiriyorum.");
    expect(parseCv).toHaveBeenCalledWith(file);
  });

  it("only keeps the CV when profile parsing is switched off", () => {
    vi.mocked(useAiFeatures).mockReturnValue(
      aiFeatures({ profileParsing: false }),
    );
    const { wizard, updatePersonal } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.choose(upload));

    expect(result.current.canRead).toBe(false);
    expect(updatePersonal).toHaveBeenCalledTimes(1);
    expect(updatePersonal).toHaveBeenCalledWith("cv", upload);
    expect(parseCv).not.toHaveBeenCalled();
  });

  it("keeps what the person already typed", async () => {
    vi.mocked(parseCv).mockResolvedValue({ current_role: "Başka rol" });
    const { wizard, updatePersonal } = wizardWith("Kurucu");
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.choose(upload));

    await waitFor(() => expect(result.current.isReading).toBe(false));
    await waitFor(() => expect(parseCv).toHaveBeenCalled());
    expect(updatePersonal).not.toHaveBeenCalledWith("role", "Başka rol");
  });

  it("does nothing more when the CV is removed", () => {
    const { wizard, updatePersonal } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.choose(null));

    expect(updatePersonal).toHaveBeenCalledWith("cv", null);
    expect(parseCv).not.toHaveBeenCalled();
  });
});
