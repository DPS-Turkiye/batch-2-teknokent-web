import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  CV_PARSE_MS,
  IntroPhase,
  MAX_EXPERTISE_AREAS,
  MentorOnboardingStep,
} from "@/interfaces/mentor-onboarding";

const CV = { name: "nihan-ozturk-cv.pdf", size: 1_800_000 };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function reachReview(result: {
  current: ReturnType<typeof useMentorOnboarding>;
}) {
  act(() => result.current.uploadCv(CV));
  act(() => void vi.advanceTimersByTime(CV_PARSE_MS));
}

describe("useMentorOnboarding", () => {
  it("starts on the intro step awaiting a CV", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    expect(result.current.step).toBe(MentorOnboardingStep.Intro);
    expect(result.current.phase).toBe(IntroPhase.Upload);
    expect(result.current.draft.cv).toBeNull();
    expect(result.current.canContinue).toBe(false);
  });

  it("moves through parsing to review after a CV is uploaded", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.uploadCv(CV));
    expect(result.current.phase).toBe(IntroPhase.Parsing);
    expect(result.current.draft.cv).toEqual(CV);
    expect(result.current.canContinue).toBe(false);

    act(() => void vi.advanceTimersByTime(CV_PARSE_MS));
    expect(result.current.phase).toBe(IntroPhase.Review);
    expect(result.current.canContinue).toBe(true);
  });

  it("skips straight to review for manual entry", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.enterManually());

    expect(result.current.phase).toBe(IntroPhase.Review);
    expect(result.current.draft.cv).toBeNull();
    expect(result.current.canContinue).toBe(true);
  });

  it("returns to upload and forgets the CV when restarted", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    reachReview(result);

    act(() => result.current.restartUpload());

    expect(result.current.phase).toBe(IntroPhase.Upload);
    expect(result.current.draft.cv).toBeNull();
  });

  it("caps expertise selection at the documented maximum", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    const picks = [
      "Finans",
      "Yatırım Alma",
      "Finansal Modelleme",
      "Strateji",
      "Birim Ekonomisi",
      "Fiyatlandırma",
    ];
    picks.forEach((area) => act(() => result.current.toggleExpertise(area)));

    expect(result.current.draft.expertise).toHaveLength(MAX_EXPERTISE_AREAS);
    expect(result.current.expertiseLimitReached).toBe(true);

    act(() => result.current.toggleExpertise("Nakit Akışı"));
    expect(result.current.draft.expertise).toHaveLength(MAX_EXPERTISE_AREAS);
    expect(result.current.draft.expertise).not.toContain("Nakit Akışı");
  });

  it("still allows deselection once the cap is reached", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    ["a", "b", "c", "d", "e", "f"].forEach((area) =>
      act(() => result.current.toggleExpertise(area)),
    );

    act(() => result.current.toggleExpertise("a"));

    expect(result.current.draft.expertise).toHaveLength(5);
    expect(result.current.expertiseLimitReached).toBe(false);
  });

  it("gates the expertise step until at least one area is chosen", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    reachReview(result);
    act(() => result.current.goNext());

    expect(result.current.step).toBe(MentorOnboardingStep.Expertise);
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.toggleExpertise("Finans"));
    expect(result.current.canContinue).toBe(true);
  });

  it("requires both a topic and a stage on the compatibility step", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    reachReview(result);
    act(() => result.current.goNext());
    act(() => result.current.toggleExpertise("Finans"));
    act(() => result.current.goNext());

    expect(result.current.step).toBe(MentorOnboardingStep.Compatibility);
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.toggleSupportTopic("Yatırıma hazırlık"));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.toggleProgramStage("build"));
    expect(result.current.canContinue).toBe(true);
  });

  it("requires a mentoring style before the profile can be completed", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    reachReview(result);
    act(() => result.current.goNext());
    act(() => result.current.toggleExpertise("Finans"));
    act(() => result.current.goNext());
    act(() => result.current.toggleSupportTopic("Yatırıma hazırlık"));
    act(() => result.current.toggleProgramStage("build"));
    act(() => result.current.goNext());

    expect(result.current.step).toBe(MentorOnboardingStep.Preferences);
    expect(result.current.isLastStep).toBe(true);
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.toggleMentoringStyle("Problem çözme"));
    expect(result.current.canContinue).toBe(true);

    act(() => result.current.complete());
    expect(result.current.completed).toBe(true);
  });

  it("does not run past either end of the step list", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.goBack());
    expect(result.current.step).toBe(MentorOnboardingStep.Intro);

    MENTOR_STEPS_FORWARD.forEach(() => act(() => result.current.goNext()));
    expect(result.current.step).toBe(MentorOnboardingStep.Preferences);
  });

  it("keeps preference selections in the draft", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.toggleWorkingStage("MVP"));
    act(() => result.current.toggleSector("SaaS"));
    act(() => result.current.setCapacity("3"));

    expect(result.current.draft.workingStages).toEqual(["MVP"]);
    expect(result.current.draft.sectors).toEqual(["SaaS"]);
    expect(result.current.draft.capacity).toBe("3");
  });
});

const MENTOR_STEPS_FORWARD = [1, 2, 3, 4, 5];
