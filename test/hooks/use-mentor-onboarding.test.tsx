import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  CV_PARSE_MS,
  IntroPhase,
  MAX_EXPERTISE_AREAS,
  MentorOnboardingStep,
} from "@/interfaces/mentor-onboarding";

import { uploadDocument } from "@/lib/client/documents";
import { parseStoredCv } from "@/lib/client/profile-analysis";
import { updateMentorProfile } from "@/lib/client/mentor-profile";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import { currentIdToken } from "@/lib/firebase/auth";

vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));
vi.mock("@/lib/client/profile-analysis", () => ({ parseStoredCv: vi.fn() }));
vi.mock("@/lib/client/mentor-profile", () => ({
  updateMentorProfile: vi.fn(),
}));
vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn(),
  saveOnboardingDraft: vi.fn(),
  clearOnboardingDraft: vi.fn(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn(),
  describeAuthError: (error: unknown) =>
    error instanceof Error ? error.message : "Bir hata oluştu.",
}));

const CV = { name: "nihan-ozturk-cv.pdf", size: 1_800_000 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(currentIdToken).mockResolvedValue("id-token");
  vi.mocked(updateMentorProfile).mockResolvedValue(
    {} as Awaited<ReturnType<typeof updateMentorProfile>>,
  );
  vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
  vi.mocked(saveOnboardingDraft).mockResolvedValue({
    kind: "mentor-onboarding",
    step: "1",
    payload: {},
  });
  vi.mocked(clearOnboardingDraft).mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

function reachReview(result: {
  current: ReturnType<typeof useMentorOnboarding>;
}) {
  act(() => result.current.uploadCv(CV));
  act(() => void vi.advanceTimersByTime(CV_PARSE_MS));
}

function fillIntroProfile(result: {
  current: ReturnType<typeof useMentorOnboarding>;
}) {
  act(() => {
    result.current.updateProfile("title", "Ürün Direktörü");
    result.current.updateProfile("company", "Peak");
    result.current.updateProfile("totalExperience", "9 yıl");
  });
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
    expect(result.current.canContinue).toBe(false);

    fillIntroProfile(result);
    expect(result.current.canContinue).toBe(true);
  });

  it("skips straight to review for manual entry", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.enterManually());

    expect(result.current.phase).toBe(IntroPhase.Review);
    expect(result.current.draft.cv).toBeNull();
    expect(result.current.canContinue).toBe(false);

    fillIntroProfile(result);
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

  it("requires a mentoring style before the profile can be completed", async () => {
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
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.toggleWorkingStage("MVP"));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.toggleSector("SaaS"));
    expect(result.current.canContinue).toBe(true);

    await act(async () => {
      await result.current.complete();
    });
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

describe("useMentorOnboarding — reading the CV", () => {
  const file = new File(["%PDF-"], "nihan-cv.pdf", {
    type: "application/pdf",
  });

  beforeEach(() => {
    vi.useRealTimers();
    vi.mocked(uploadDocument).mockReset();
    vi.mocked(parseStoredCv).mockReset();
    vi.mocked(updateMentorProfile).mockClear();
    vi.mocked(uploadDocument).mockResolvedValue({
      id: "cv-1",
      kind: "cv",
      originalFilename: "nihan-cv.pdf",
      sizeBytes: 5,
    });
  });

  it("fills the form from the stored CV, read as a mentor's", async () => {
    vi.mocked(parseStoredCv).mockResolvedValue({
      current_role: "Head of Design",
      current_company: "Looply",
      years_of_experience: 12,
      professional_functions: ["UX"],
      work_history: [
        {
          title: "Senior Designer",
          organization: "Peak",
          period: "2016 – 2021",
          summary: null,
        },
      ],
    });
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.uploadCv({ name: file.name, size: 5, file }));

    await waitFor(() => expect(result.current.phase).toBe(IntroPhase.Review));
    expect(parseStoredCv).toHaveBeenCalledWith("cv-1", "mentor");
    expect(result.current.draft.profile).toMatchObject({
      title: "Head of Design",
      company: "Looply",
      totalExperience: "12 yıl",
      inferredAreas: ["UX"],
    });
    expect(result.current.areaOptions).toContain("UX");
    expect(result.current.parseNote).toBe("");
    expect(result.current.canContinue).toBe(true);
  });

  it("still opens the form, with a note, when the CV cannot be read", async () => {
    vi.mocked(parseStoredCv).mockRejectedValue(new Error("okunamadı"));
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.uploadCv({ name: file.name, size: 5, file }));

    await waitFor(() => expect(result.current.phase).toBe(IntroPhase.Review));
    expect(result.current.parseNote).toContain("CV'nizi okuyamadık");
    expect(result.current.draft.profile.title).toBe("");
  });

  it("saves the past roles the CV listed", async () => {
    vi.mocked(parseStoredCv).mockResolvedValue({
      current_role: "Head of Design",
      current_company: "Looply",
      years_of_experience: 12,
      work_history: [
        {
          title: "Senior Designer",
          organization: "Peak",
          period: "2016 – 2021",
          summary: null,
        },
      ],
    });
    const { result } = renderHook(() => useMentorOnboarding());
    act(() => result.current.uploadCv({ name: file.name, size: 5, file }));
    await waitFor(() => expect(result.current.phase).toBe(IntroPhase.Review));

    act(() => result.current.toggleMentoringStyle("Problem çözme"));
    await act(async () => {
      await result.current.complete();
    });

    expect(updateMentorProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        experiences: [
          {
            title: "Senior Designer",
            organization: "Peak",
            period: "2016 – 2021",
            summary: "",
          },
        ],
      }),
      "id-token",
    );
  });
});

const MENTOR_STEPS_FORWARD = [1, 2, 3, 4, 5];

describe("useMentorOnboarding — saving the profile", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
    vi.mocked(saveOnboardingDraft).mockResolvedValue({
      kind: "mentor-onboarding",
      step: "1",
      payload: {},
    });
    vi.mocked(clearOnboardingDraft).mockResolvedValue(undefined);
  });

  it("sends the collected draft to the mentor profile endpoint", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue(
      {} as Awaited<ReturnType<typeof updateMentorProfile>>,
    );
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => {
      result.current.updateProfile("title", "Ürün Direktörü");
      result.current.updateProfile("company", "Peak");
    });
    act(() => {
      result.current.toggleExpertise("Finans");
      result.current.toggleSector("SaaS");
      result.current.toggleSector("Fintech");
      result.current.toggleWorkingStage("MVP");
      result.current.toggleMentoringStyle("Problem çözme");
    });
    await act(async () => {
      await result.current.complete();
    });

    expect(updateMentorProfile).toHaveBeenCalledWith(
      {
        professionalTitle: "Ürün Direktörü",
        company: "Peak",
        availabilityLabel: "",
        responseTimeLabel: "",
        meetingMode: "",
        communicationPreference: "",
        mentoringStyle: "Problem çözme",
        fitLabel: "",
        experienceLevel: "Finans",
        sectorExperience: "SaaS, Fintech",
        startupStages: "MVP",
        specialties: ["Finans"],
      },
      "id-token",
    );
    expect(result.current.completed).toBe(true);
  });

  it("surfaces a save failure instead of claiming the profile is done", async () => {
    vi.mocked(updateMentorProfile).mockRejectedValue(
      new Error("Profil kaydedilemedi."),
    );
    const { result } = renderHook(() => useMentorOnboarding());

    await act(async () => {
      await result.current.complete();
    });

    expect(result.current.saveError).toBe("Profil kaydedilemedi.");
    expect(result.current.completed).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it("surfaces a CV upload failure rather than silently resetting", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(
      new Error("Yükleme başarısız."),
    );
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => {
      result.current.uploadCv({
        name: "cv.pdf",
        size: 1024,
        file: new File(["x"], "cv.pdf"),
      });
    });

    await waitFor(() =>
      expect(result.current.uploadError).toBe("Yükleme başarısız."),
    );
    expect(result.current.phase).toBe(IntroPhase.Upload);
  });
});

describe("useMentorOnboarding — resuming after a refresh", () => {
  let stored: {
    kind: "mentor-onboarding";
    step: string;
    payload: unknown;
  } | null;

  beforeEach(() => {
    vi.useRealTimers();
    stored = null;
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    vi.mocked(updateMentorProfile).mockResolvedValue(
      {} as Awaited<ReturnType<typeof updateMentorProfile>>,
    );
    vi.mocked(fetchOnboardingDraft).mockImplementation(async () => stored);
    vi.mocked(saveOnboardingDraft).mockImplementation(async (_token, body) => {
      stored = {
        kind: "mentor-onboarding",
        step: body.step,
        payload: body.payload,
      };
      return stored;
    });
    vi.mocked(clearOnboardingDraft).mockImplementation(async () => {
      stored = null;
    });
  });

  it("restores selections made before the page was reloaded", async () => {
    const first = renderHook(() => useMentorOnboarding());
    await waitFor(() => expect(fetchOnboardingDraft).toHaveBeenCalled());
    act(() => {
      first.result.current.toggleExpertise("Finans");
      first.result.current.updateProfile("company", "Peak");
    });
    first.unmount();
    await waitFor(() =>
      expect(stored?.payload).toEqual(
        expect.objectContaining({
          expertise: ["Finans"],
          profile: expect.objectContaining({ company: "Peak" }),
        }),
      ),
    );

    const second = renderHook(() => useMentorOnboarding());

    await waitFor(() =>
      expect(second.result.current.draft.expertise).toEqual(["Finans"]),
    );
    expect(second.result.current.draft.profile.company).toBe("Peak");
    expect(second.result.current.droppedFiles).toBe(0);
  });

  it("reports an attachment that could not survive the reload", async () => {
    const first = renderHook(() => useMentorOnboarding());
    await waitFor(() => expect(fetchOnboardingDraft).toHaveBeenCalled());
    act(() =>
      first.result.current.uploadCv({
        name: "cv.pdf",
        size: 10,
        file: new File(["x"], "cv.pdf"),
      }),
    );
    first.unmount();
    await waitFor(() =>
      expect(stored?.payload).toEqual(
        expect.objectContaining({
          cv: { name: "cv.pdf", size: 10 },
        }),
      ),
    );

    const second = renderHook(() => useMentorOnboarding());

    await waitFor(() => expect(second.result.current.droppedFiles).toBe(1));
    expect(second.result.current.draft.cv).toBeNull();
  });

  it("forgets the draft once the profile is saved", async () => {
    const first = renderHook(() => useMentorOnboarding());
    await waitFor(() => expect(fetchOnboardingDraft).toHaveBeenCalled());
    act(() => first.result.current.toggleExpertise("Finans"));
    await act(async () => {
      await first.result.current.complete();
    });
    first.unmount();

    const second = renderHook(() => useMentorOnboarding());

    await waitFor(() =>
      expect(second.result.current.draft.expertise).toEqual([]),
    );
    expect(stored).toBeNull();
  });
});
