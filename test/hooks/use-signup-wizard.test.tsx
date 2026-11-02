import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSignupWizard } from "@/hooks/use-signup-wizard";
import {
  ContactPreference,
  MAX_SUPPORT_AREAS,
  SignupStep,
  StartupDocumentKind,
  SUPPORT_AREA_OPTIONS,
} from "@/interfaces/signup";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/client/onboarding-draft";

vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
}));

vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn(),
  saveOnboardingDraft: vi.fn(),
  clearOnboardingDraft: vi.fn(),
}));

/** Mount the wizard and flush the async draft-restore effect (setReady). */
async function renderWizard(options?: Parameters<typeof useSignupWizard>[0]) {
  const rendered = renderHook(() => useSignupWizard(options));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  return rendered;
}

function fillPersonal(result: { current: ReturnType<typeof useSignupWizard> }) {
  act(() => {
    result.current.updatePersonal("firstName", "Gülse");
    result.current.updatePersonal("lastName", "Buran");
    result.current.updatePersonal("role", "Designer");
  });
}

describe("useSignupWizard", () => {
  beforeEach(() => {
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
    vi.mocked(saveOnboardingDraft).mockResolvedValue({
      kind: "signup-wizard",
      step: "1",
      payload: {},
    });
    vi.mocked(clearOnboardingDraft).mockResolvedValue(undefined);
  });

  it("starts on the personal profile step with an empty draft", async () => {
    const { result } = await renderWizard();

    expect(result.current.step).toBe(SignupStep.PersonalProfile);
    expect(result.current.submitted).toBe(false);
    expect(result.current.draft.personal.firstName).toBe("");
    expect(result.current.draft.documents).toEqual({});
  });

  it("blocks the first step until name, surname and role are filled", async () => {
    const { result } = await renderWizard();

    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updatePersonal("firstName", "Gülse"));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updatePersonal("lastName", "Buran"));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updatePersonal("role", "Designer"));
    expect(result.current.canContinue).toBe(true);
  });

  it("treats whitespace-only values as unfilled", async () => {
    const { result } = await renderWizard();

    act(() => {
      result.current.updatePersonal("firstName", "   ");
      result.current.updatePersonal("lastName", "   ");
      result.current.updatePersonal("role", "   ");
    });

    expect(result.current.canContinue).toBe(false);
  });

  it("returns to the top of the page when the step changes", async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    const { result } = await renderWizard();
    fillPersonal(result);
    scrollTo.mockClear();

    act(() => result.current.goNext());
    expect(scrollTo).toHaveBeenCalledWith(0, 0);

    scrollTo.mockClear();
    act(() => result.current.goBack());
    expect(scrollTo).toHaveBeenCalledWith(0, 0);

    vi.unstubAllGlobals();
  });

  it("blocks the startup step until a program, the name and tagline are filled", async () => {
    const { result } = await renderWizard();
    fillPersonal(result);
    act(() => result.current.goNext());

    expect(result.current.step).toBe(SignupStep.StartupProfile);
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updateStartup("name", "Döngü"));
    // Website and logo are optional in the revised design.
    act(() =>
      result.current.updateStartup("tagline", "Gönüllüleri eşleştirir"),
    );
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.updateStartup("programId", "program-1"));
    expect(result.current.canContinue).toBe(true);
  });

  it("skips the documents step for someone creating their startup later", async () => {
    const { result } = await renderWizard();
    fillPersonal(result);
    act(() => result.current.goNext());
    act(() => result.current.updateStartup("programId", "program-1"));
    act(() => result.current.updateStartup("startupLater", true));

    expect(result.current.canContinue).toBe(true);
    expect(result.current.steps).not.toContain(SignupStep.Documents);
    act(() => result.current.goNext());
    expect(result.current.step).toBe(SignupStep.Review);
    act(() => result.current.goBack());
    expect(result.current.step).toBe(SignupStep.StartupProfile);
  });

  it("moves forward and back through the steps without overrunning either end", async () => {
    const { result } = await renderWizard();

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

  it("jumps straight to a step when a review section is edited", async () => {
    const { result } = await renderWizard();

    act(() => result.current.goToStep(SignupStep.Review));
    expect(result.current.step).toBe(SignupStep.Review);

    act(() => result.current.goToStep(SignupStep.PersonalProfile));
    expect(result.current.step).toBe(SignupStep.PersonalProfile);
  });

  it("toggles contact preferences and caps support areas at three", async () => {
    const { result } = await renderWizard();

    act(() => result.current.toggleContactPreference(ContactPreference.Email));
    act(() =>
      result.current.toggleContactPreference(ContactPreference.VideoCall),
    );
    act(() => result.current.toggleContactPreference(ContactPreference.Email));
    expect(result.current.draft.personal.contactPreferences).toEqual([
      ContactPreference.VideoCall,
    ]);

    act(() => {
      for (const area of SUPPORT_AREA_OPTIONS.slice(0, MAX_SUPPORT_AREAS + 1)) {
        result.current.toggleSupportArea(area);
      }
    });
    expect(result.current.draft.startup.supportAreas).toHaveLength(
      MAX_SUPPORT_AREAS,
    );
    expect(result.current.supportAreaLimitReached).toBe(true);

    act(() => result.current.toggleSupportArea(SUPPORT_AREA_OPTIONS[0]));
    expect(result.current.draft.startup.supportAreas).toHaveLength(
      MAX_SUPPORT_AREAS - 1,
    );
    expect(result.current.supportAreaLimitReached).toBe(false);
  });

  it("counts remaining characters for the capped text fields", async () => {
    const { result } = await renderWizard();

    expect(result.current.bioRemaining).toBe(280);
    expect(result.current.taglineRemaining).toBe(80);

    act(() => result.current.updatePersonal("bio", "abcde"));
    act(() => result.current.updateStartup("tagline", "abc"));

    expect(result.current.bioRemaining).toBe(275);
    expect(result.current.taglineRemaining).toBe(77);
  });

  it("keeps a document until it is removed", async () => {
    const { result } = await renderWizard();

    act(() =>
      result.current.setDocument(StartupDocumentKind.PitchDeck, {
        name: "deck.pdf",
        size: 1024,
      }),
    );
    expect(
      result.current.draft.documents[StartupDocumentKind.PitchDeck]?.name,
    ).toBe("deck.pdf");

    act(() => result.current.setDocument(StartupDocumentKind.PitchDeck, null));
    expect(result.current.draft.documents).toEqual({});
  });

  it("adds and removes teammates listed at signup, and keeps the MVP link", async () => {
    const { result } = await renderWizard();

    act(() => {
      result.current.addTeamMember({
        fullName: "Ece Kaya",
        jobTitle: "CTO",
        email: "",
      });
      result.current.addTeamMember({
        fullName: "Can Er",
        jobTitle: "",
        email: "can@dongu.co",
      });
      result.current.setMvpUrl("https://app.dongu.co");
    });
    expect(
      result.current.draft.startup.teamMembers.map((m) => m.fullName),
    ).toEqual(["Ece Kaya", "Can Er"]);
    expect(result.current.draft.mvpUrl).toBe("https://app.dongu.co");

    act(() => result.current.removeTeamMember(0));
    expect(
      result.current.draft.startup.teamMembers.map((m) => m.fullName),
    ).toEqual(["Can Er"]);
  });

  it("only lets the review step submit once consent is given", async () => {
    const { result } = await renderWizard();
    act(() => result.current.goToStep(SignupStep.Review));

    expect(result.current.isLastStep).toBe(true);
    expect(result.current.canContinue).toBe(false);
    act(() => result.current.setConsent(true));
    expect(result.current.canContinue).toBe(true);
  });

  it("records a draft save without submitting the profile", async () => {
    const { result } = await renderWizard();

    expect(result.current.draftSavedAt).toBeNull();

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(result.current.draftSavedAt).not.toBeNull();
    expect(result.current.submitted).toBe(false);
    expect(saveOnboardingDraft).toHaveBeenCalled();
  });

  it("restores a previously saved draft from the server", async () => {
    vi.mocked(fetchOnboardingDraft).mockResolvedValue({
      kind: "signup-wizard",
      step: "2",
      payload: {
        personal: { firstName: "Gülse", lastName: "Buran", role: "Designer" },
        startup: { name: "Döngü" },
      },
    });

    const { result } = await renderWizard();

    await waitFor(() =>
      expect(result.current.draft.personal.firstName).toBe("Gülse"),
    );
    expect(result.current.step).toBe(SignupStep.StartupProfile);
    expect(result.current.draft.startup.name).toBe("Döngü");
  });

  it("keeps the startup stage, program and founding year in the draft", async () => {
    const { result } = await renderWizard();

    act(() => {
      result.current.updateStartup("maturity", "Prototip");
      result.current.updateStartup("programId", null);
      result.current.updateStartup("foundedYear", "2025");
    });

    expect(result.current.draft.startup.maturity).toBe("Prototip");
    expect(result.current.draft.startup.programId).toBeNull();
    expect(result.current.draft.startup.foundedYear).toBe("2025");
  });

  it("no longer tracks the fields the revised design dropped", async () => {
    const { result } = await renderWizard();

    for (const dropped of [
      "problem",
      "solution",
      "targetUser",
      "sector",
      "programLevel",
    ]) {
      expect(result.current.draft.startup).not.toHaveProperty(dropped);
    }
    expect(result.current.draft.personal).not.toHaveProperty("expertise");
  });

  it("flips to the submitted state only when submit is called", async () => {
    const { result } = await renderWizard();

    act(() => result.current.goToStep(SignupStep.Review));
    expect(result.current.submitted).toBe(false);

    await act(() => result.current.submit());
    expect(result.current.submitted).toBe(true);
  });

  it("sends the draft to the submit handler before flipping state", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = await renderWizard({ onSubmit });

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
    const { result } = await renderWizard({ onSubmit });

    await act(() => result.current.submit());

    expect(result.current.submitted).toBe(false);
    expect(result.current.submitError).toBe("Davet kodu geçersiz");
    expect(result.current.submitting).toBe(false);
  });
});
