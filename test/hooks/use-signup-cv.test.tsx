import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
import { useSignupCv } from "@/hooks/use-signup-cv";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { BackendErrorCode } from "@/interfaces/ai-features";
import { isAiFeatureDisabledError } from "@/lib/ai-features";
import { ClientApiError } from "@/lib/client/api";
import { parseCv } from "@/lib/client/profile-analysis";
import { aiFeatures } from "@test/fixtures/ai-features";
import { signupDraft, signupWizardStub } from "@test/fixtures/signup-wizard";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-ai-features", () => ({
  useAiFeatures: vi.fn(),
  useAiFeatureRefusal: vi.fn(),
}));

/** What a screen does with a failure; a switched-off refusal answers true. */
const refused = vi.fn((error: unknown) => isAiFeatureDisabledError(error));
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

function wizardWith(role = "", cv: typeof upload | null = null) {
  const updatePersonal = vi.fn<SignupWizard["updatePersonal"]>();
  const wizard = signupWizardStub({
    draft: signupDraft({ personal: { role, bio: "", cv } }),
    updatePersonal,
  });
  return { wizard, updatePersonal };
}

describe("useSignupCv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiFeatures).mockReturnValue(aiFeatures());
    vi.mocked(useAiFeatureRefusal).mockReturnValue(refused);
  });

  it("keeps the CV and suggests the role and bio from it", async () => {
    vi.mocked(parseCv).mockResolvedValue({
      current_role: "Ürün Yöneticisi",
      professional_summary: "Ürün geliştiriyorum.",
    });
    const { wizard, updatePersonal } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.setConsent(true));
    act(() => result.current.choose(upload));

    expect(updatePersonal).toHaveBeenCalledWith("cv", upload);
    await waitFor(() =>
      expect(updatePersonal).toHaveBeenCalledWith("role", "Ürün Yöneticisi"),
    );
    expect(updatePersonal).toHaveBeenCalledWith("bio", "Ürün geliştiriyorum.");
    expect(parseCv).toHaveBeenCalledWith(file, true);
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

    act(() => result.current.setConsent(true));
    act(() => result.current.choose(upload));

    await waitFor(() => expect(parseCv).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isReading).toBe(false));
    expect(updatePersonal).not.toHaveBeenCalledWith("role", "Başka rol");
  });

  it("hands a switched-off refusal on so the switches are read again", async () => {
    const refusal = new ClientApiError(
      "off",
      403,
      BackendErrorCode.AiFeatureDisabled,
    );
    vi.mocked(parseCv).mockRejectedValue(refusal);
    const { wizard } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.setConsent(true));
    act(() => result.current.choose(upload));

    await waitFor(() => expect(refused).toHaveBeenCalledWith(refusal));
    await waitFor(() => expect(result.current.error).toBe("off"));
  });

  it("does nothing more when the CV is removed", () => {
    const { wizard, updatePersonal } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.choose(null));

    expect(updatePersonal).toHaveBeenCalledWith("cv", null);
    expect(parseCv).not.toHaveBeenCalled();
  });

  it("starts unticked and only keeps the CV until the person agrees", () => {
    const { wizard, updatePersonal } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.choose(upload));

    expect(result.current.consent).toBe(false);
    expect(updatePersonal).toHaveBeenCalledTimes(1);
    expect(updatePersonal).toHaveBeenCalledWith("cv", upload);
    expect(parseCv).not.toHaveBeenCalled();
  });

  it("reads a CV already chosen once the person ticks the consent", async () => {
    vi.mocked(parseCv).mockResolvedValue({ current_role: "Ürün Yöneticisi" });
    const { wizard, updatePersonal } = wizardWith("", upload);
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.setConsent(true));

    await waitFor(() =>
      expect(updatePersonal).toHaveBeenCalledWith("role", "Ürün Yöneticisi"),
    );
    expect(parseCv).toHaveBeenCalledWith(file, true);
  });

  it("reads nothing when the consent is taken back", () => {
    const { wizard } = wizardWith();
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.setConsent(true));
    act(() => result.current.setConsent(false));
    act(() => result.current.choose(upload));

    expect(result.current.consent).toBe(false);
    expect(parseCv).not.toHaveBeenCalled();
  });

  it("does not send the same CV twice when the box is ticked again", async () => {
    vi.mocked(parseCv).mockResolvedValue({ current_role: "Ürün Yöneticisi" });
    const { wizard } = wizardWith("", upload);
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.setConsent(true));
    await waitFor(() => expect(result.current.isReading).toBe(false));
    act(() => result.current.setConsent(false));
    act(() => result.current.setConsent(true));

    expect(parseCv).toHaveBeenCalledTimes(1);
  });

  it("drops a reading that finishes after the consent was taken back", async () => {
    let finish!: (value: { current_role: string }) => void;
    vi.mocked(parseCv).mockReturnValue(
      new Promise((done) => {
        finish = done;
      }),
    );
    const { wizard, updatePersonal } = wizardWith("", upload);
    const { result } = renderHook(() => useSignupCv(wizard), { wrapper });

    act(() => result.current.setConsent(true));
    await waitFor(() => expect(parseCv).toHaveBeenCalled());
    act(() => result.current.setConsent(false));
    await act(async () => {
      finish({ current_role: "Ürün Yöneticisi" });
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.isReading).toBe(false));
    expect(updatePersonal).not.toHaveBeenCalledWith("role", "Ürün Yöneticisi");
  });
});
