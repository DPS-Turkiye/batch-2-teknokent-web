import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSignupWizard } from "@/hooks/use-signup-wizard";
import { SignupStep, StartupDocumentKind } from "@/interfaces/signup";

function fillPersonal(result: { current: ReturnType<typeof useSignupWizard> }) {
  act(() => {
    result.current.updatePersonal("firstName", "Gülse");
    result.current.updatePersonal("lastName", "Buran");
    result.current.updatePersonal("role", "Designer");
  });
}

describe("useSignupWizard", () => {
  it("starts on the personal profile step with an empty draft", () => {
    const { result } = renderHook(() => useSignupWizard());

    expect(result.current.step).toBe(SignupStep.PersonalProfile);
    expect(result.current.submitted).toBe(false);
    expect(result.current.draft.personal.firstName).toBe("");
    expect(result.current.draft.documents).toEqual({});
  });

  it("blocks the first step until name, surname and role are filled", () => {
    const { result } = renderHook(() => useSignupWizard());

    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updatePersonal("firstName", "Gülse"));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updatePersonal("lastName", "Buran"));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updatePersonal("role", "Designer"));
    expect(result.current.canContinue).toBe(true);
  });

  it("treats whitespace-only values as unfilled", () => {
    const { result } = renderHook(() => useSignupWizard());

    act(() => {
      result.current.updatePersonal("firstName", "   ");
      result.current.updatePersonal("lastName", "   ");
      result.current.updatePersonal("role", "   ");
    });

    expect(result.current.canContinue).toBe(false);
  });

  it("blocks the startup step until name, tagline and website are filled", () => {
    const { result } = renderHook(() => useSignupWizard());
    fillPersonal(result);
    act(() => result.current.goNext());

    expect(result.current.step).toBe(SignupStep.StartupProfile);
    expect(result.current.canContinue).toBe(false);

    act(() => {
      result.current.updateStartup("name", "Döngü");
      result.current.updateStartup("tagline", "Gönüllüleri eşleştirir");
      result.current.updateStartup("website", "https://dongu.example");
    });

    expect(result.current.canContinue).toBe(true);
  });

  it("moves forward and back through the steps without overrunning either end", () => {
    const { result } = renderHook(() => useSignupWizard());

    act(() => result.current.goBack());
    expect(result.current.step).toBe(SignupStep.PersonalProfile);

    act(() => result.current.goNext());
    expect(result.current.step).toBe(SignupStep.StartupProfile);

    act(() => result.current.goNext());
    act(() => result.current.goNext());
    expect(result.current.step).toBe(SignupStep.Review);
    expect(result.current.isLastStep).toBe(true);

    act(() => result.current.goNext());
    expect(result.current.step).toBe(SignupStep.Review);

    act(() => result.current.goBack());
    expect(result.current.step).toBe(SignupStep.Documents);
  });

  it("jumps straight to a step when a review section is edited", () => {
    const { result } = renderHook(() => useSignupWizard());

    act(() => result.current.goToStep(SignupStep.Review));
    expect(result.current.step).toBe(SignupStep.Review);

    act(() => result.current.goToStep(SignupStep.PersonalProfile));
    expect(result.current.step).toBe(SignupStep.PersonalProfile);
  });

  it("toggles expertise, support areas and contact preferences on and off", () => {
    const { result } = renderHook(() => useSignupWizard());

    act(() => result.current.toggleExpertise("Figma"));
    act(() => result.current.toggleExpertise("Branding"));
    expect(result.current.draft.personal.expertise).toEqual([
      "Figma",
      "Branding",
    ]);

    act(() => result.current.toggleExpertise("Figma"));
    expect(result.current.draft.personal.expertise).toEqual(["Branding"]);

    act(() => result.current.toggleSupportArea("Finans"));
    expect(result.current.draft.startup.supportAreas).toEqual(["Finans"]);

    act(() => result.current.toggleContactPreference("Mesaj"));
    expect(result.current.draft.personal.contactPreferences).toEqual(["Mesaj"]);
  });

  it("counts remaining characters for the capped text fields", () => {
    const { result } = renderHook(() => useSignupWizard());

    expect(result.current.bioRemaining).toBe(280);
    expect(result.current.taglineRemaining).toBe(80);

    act(() => result.current.updatePersonal("bio", "abcde"));
    act(() => result.current.updateStartup("tagline", "abc"));

    expect(result.current.bioRemaining).toBe(275);
    expect(result.current.taglineRemaining).toBe(77);
  });

  it("marks checklist entries done as their documents arrive, and undone when removed", () => {
    const { result } = renderHook(() => useSignupWizard());

    expect(result.current.checklist.every((item) => !item.done)).toBe(true);

    act(() =>
      result.current.setDocument(StartupDocumentKind.PitchDeck, {
        name: "deck.pdf",
        size: 1024,
      }),
    );

    const pitch = result.current.checklist.find(
      (item) => item.kind === StartupDocumentKind.PitchDeck,
    );
    expect(pitch?.done).toBe(true);
    expect(result.current.checklist.filter((item) => item.done)).toHaveLength(
      1,
    );

    act(() => result.current.setDocument(StartupDocumentKind.PitchDeck, null));
    expect(result.current.draft.documents).toEqual({});
  });

  it("reports profile completion and names what is still missing", () => {
    const { result } = renderHook(() => useSignupWizard());

    expect(result.current.completion.percent).toBe(0);
    expect(result.current.completion.missing).toContain("Web sitesi URL'i");

    fillPersonal(result);
    expect(result.current.completion.percent).toBeGreaterThan(0);
    expect(result.current.completion.missing).not.toContain("Ad");

    act(() => result.current.updateStartup("website", "https://dongu.example"));
    expect(result.current.completion.missing).not.toContain("Web sitesi URL'i");
  });

  it("records a draft save without submitting the profile", () => {
    const { result } = renderHook(() => useSignupWizard());

    expect(result.current.draftSavedAt).toBeNull();

    act(() => result.current.saveDraft());

    expect(result.current.draftSavedAt).not.toBeNull();
    expect(result.current.submitted).toBe(false);
  });

  it("keeps the new startup fields in the draft", () => {
    const { result } = renderHook(() => useSignupWizard());

    act(() => {
      result.current.updateStartup("solution", "Eşleştirme motoru");
      result.current.updateStartup("targetUser", "KOBİ'ler");
      result.current.updateStartup("sector", "SaaS");
      result.current.updateStartup("teamSize", "3");
      result.current.updateStartup("productStatus", "Prototip / wireframe");
    });

    expect(result.current.draft.startup.solution).toBe("Eşleştirme motoru");
    expect(result.current.draft.startup.targetUser).toBe("KOBİ'ler");
    expect(result.current.draft.startup.sector).toBe("SaaS");
    expect(result.current.draft.startup.teamSize).toBe("3");
    expect(result.current.draft.startup.productStatus).toBe(
      "Prototip / wireframe",
    );
  });

  it("flips to the submitted state only when submit is called", async () => {
    const { result } = renderHook(() => useSignupWizard());

    act(() => result.current.goToStep(SignupStep.Review));
    expect(result.current.submitted).toBe(false);

    await act(() => result.current.submit());
    expect(result.current.submitted).toBe(true);
  });

  it("sends the draft to the submit handler before flipping state", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSignupWizard({ onSubmit }));

    act(() => result.current.updateStartup("name", "Döngü"));
    await act(() => result.current.submit());

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        startup: expect.objectContaining({ name: "Döngü" }),
      }),
    );
    expect(result.current.submitted).toBe(true);
  });

  it("stays unsubmitted and reports the reason when the handler fails", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Davet kodu geçersiz"));
    const { result } = renderHook(() => useSignupWizard({ onSubmit }));

    await act(() => result.current.submit());

    expect(result.current.submitted).toBe(false);
    expect(result.current.submitError).toBe("Davet kodu geçersiz");
    expect(result.current.submitting).toBe(false);
  });
});
