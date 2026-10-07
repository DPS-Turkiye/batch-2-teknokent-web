import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorOnboarding } from "@/hooks/use-mentor-onboarding";
import { Weekday } from "@/interfaces/mentor";
import {
  IntroPhase,
  MAX_MENTOR_TOPICS,
  MENTOR_TOPIC_OPTIONS,
  MentorOnboardingStep,
} from "@/interfaces/mentor-onboarding";
import { uploadDocument } from "@/lib/client/documents";
import {
  updateAvailabilitySettings,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import { parseStoredCv } from "@/lib/client/profile-analysis";
import { getUserProfile, saveUserProfile } from "@/lib/client/user-profile";
import { currentIdToken } from "@/lib/firebase/auth";

vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));
vi.mock("@/lib/client/profile-analysis", () => ({ parseStoredCv: vi.fn() }));
vi.mock("@/lib/client/mentor-profile", () => ({
  updateMentorProfile: vi.fn(),
  updateAvailabilitySettings: vi.fn(),
}));
vi.mock("@/lib/client/user-profile", () => ({
  getUserProfile: vi.fn(),
  saveUserProfile: vi.fn(),
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

type Hook = { current: ReturnType<typeof useMentorOnboarding> };

const cvFile = new File(["%PDF-"], "nihan-cv.pdf", { type: "application/pdf" });

let stored: {
  kind: "mentor-onboarding";
  step: string;
  payload: unknown;
} | null;

beforeEach(() => {
  vi.clearAllMocks();
  stored = null;
  vi.mocked(currentIdToken).mockResolvedValue("id-token");
  vi.mocked(updateMentorProfile).mockResolvedValue(
    {} as Awaited<ReturnType<typeof updateMentorProfile>>,
  );
  vi.mocked(updateAvailabilitySettings).mockResolvedValue(
    {} as Awaited<ReturnType<typeof updateAvailabilitySettings>>,
  );
  vi.mocked(getUserProfile).mockResolvedValue({
    id: "u1",
    fullName: "Nihan Öztürk",
    email: "nihan@mentor.co",
    jobTitle: null,
    phone: "+905551112233",
    bio: "Mevcut biyografi",
    linkedinUrl: null,
    expertise: ["UX"],
  });
  vi.mocked(saveUserProfile).mockResolvedValue(
    {} as Awaited<ReturnType<typeof saveUserProfile>>,
  );
  vi.mocked(uploadDocument).mockResolvedValue({
    id: "cv-1",
    kind: "cv",
    originalFilename: "nihan-cv.pdf",
    sizeBytes: 5,
  });
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

function fillProfile(result: Hook) {
  act(() => {
    result.current.enterManually();
    result.current.updateProfile("title", "Ürün Direktörü");
    result.current.updateProfile("company", "Peak");
    result.current.updateProfile("totalExperience", "9 yıl");
  });
}

function fillAreas(result: Hook) {
  act(() => {
    result.current.toggleTopic("Ürün stratejisi");
    result.current.toggleStage("MVP");
  });
}

function openTuesday(result: Hook) {
  act(() =>
    result.current.updateDay(Weekday.Tuesday, {
      enabled: true,
      start: "14:00",
      end: "17:00",
    }),
  );
}

describe("useMentorOnboarding", () => {
  it("prefills the name from the account and waits for a CV", () => {
    const { result } = renderHook(() =>
      useMentorOnboarding({ fullName: "Nihan Ayşe Öztürk" }),
    );

    expect(result.current.step).toBe(MentorOnboardingStep.Profile);
    expect(result.current.phase).toBe(IntroPhase.Upload);
    expect(result.current.draft.firstName).toBe("Nihan Ayşe");
    expect(result.current.draft.lastName).toBe("Öztürk");
    expect(result.current.isFirstScreen).toBe(true);
    expect(result.current.canContinue).toBe(false);
  });

  it("opens the form by hand and asks for title and experience before moving on", () => {
    const { result } = renderHook(() =>
      useMentorOnboarding({ fullName: "Nihan Öztürk" }),
    );

    act(() => result.current.enterManually());
    expect(result.current.phase).toBe(IntroPhase.Review);
    expect(result.current.canContinue).toBe(false);

    fillProfile(result);
    expect(result.current.canContinue).toBe(true);
  });

  it("steps back from the form to the CV upload before leaving step 1", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => result.current.enterManually());
    act(() => result.current.goBack());

    expect(result.current.step).toBe(MentorOnboardingStep.Profile);
    expect(result.current.phase).toBe(IntroPhase.Upload);
  });

  it("needs a topic and a stage on the areas step, and caps topics", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    act(() => result.current.goToStep(MentorOnboardingStep.Areas));

    act(() => result.current.toggleTopic(MENTOR_TOPIC_OPTIONS[0]));
    expect(result.current.canContinue).toBe(false);
    act(() => result.current.toggleStage("Fikir"));
    expect(result.current.canContinue).toBe(true);

    act(() => {
      for (const topic of MENTOR_TOPIC_OPTIONS.slice(1))
        result.current.toggleTopic(topic);
    });
    expect(result.current.draft.topics).toHaveLength(MAX_MENTOR_TOPICS);
    expect(result.current.topicLimitReached).toBe(true);

    act(() => result.current.toggleTopic(MENTOR_TOPIC_OPTIONS[0]));
    expect(result.current.draft.topics).toHaveLength(MAX_MENTOR_TOPICS - 1);
  });

  it("keeps offerings unique and ignores blank ones", () => {
    const { result } = renderHook(() => useMentorOnboarding());

    act(() => {
      result.current.addOffering("  Pitch deck incelemesi ");
      result.current.addOffering("Pitch deck incelemesi");
      result.current.addOffering("   ");
    });
    expect(result.current.draft.offerings).toEqual(["Pitch deck incelemesi"]);

    act(() => result.current.removeOffering(0));
    expect(result.current.draft.offerings).toEqual([]);
  });

  it("needs at least one open day, and no day that ends before it starts", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    act(() => result.current.goToStep(MentorOnboardingStep.Availability));
    expect(result.current.canContinue).toBe(false);

    openTuesday(result);
    expect(result.current.canContinue).toBe(true);

    act(() => result.current.updateDay(Weekday.Tuesday, { end: "13:00" }));
    expect(result.current.invalidDays).toEqual([Weekday.Tuesday]);
    expect(result.current.canContinue).toBe(false);
  });

  it("only sends once the principles are accepted", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    act(() => result.current.goToStep(MentorOnboardingStep.Review));

    expect(result.current.isLastStep).toBe(true);
    expect(result.current.canContinue).toBe(false);
    act(() => result.current.update("consent", true));
    expect(result.current.canContinue).toBe(true);
  });

  it("does not run past either end of the step list", () => {
    const { result } = renderHook(() => useMentorOnboarding());
    act(() => result.current.goToStep(MentorOnboardingStep.Review));
    act(() => result.current.goNext());
    expect(result.current.step).toBe(MentorOnboardingStep.Review);

    act(() => result.current.goToStep(MentorOnboardingStep.Areas));
    act(() => result.current.goBack());
    act(() => result.current.goBack());
    expect(result.current.step).toBe(MentorOnboardingStep.Profile);
  });
});

describe("useMentorOnboarding — reading the CV", () => {
  it("uploads the CV, reads it as a mentor's and fills only the empty fields", async () => {
    vi.mocked(parseStoredCv).mockResolvedValue({
      full_name: "Nihan Öztürk",
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
    const { result } = renderHook(() =>
      useMentorOnboarding({ fullName: "Nihan Öztürk" }),
    );

    act(
      () =>
        void result.current.uploadCv({
          name: cvFile.name,
          size: 5,
          file: cvFile,
        }),
    );
    expect(result.current.phase).toBe(IntroPhase.Parsing);

    await waitFor(() => expect(result.current.phase).toBe(IntroPhase.Review));
    expect(uploadDocument).toHaveBeenCalledWith(cvFile, "cv", "id-token");
    expect(parseStoredCv).toHaveBeenCalledWith("cv-1", "mentor");
    expect(result.current.draft.profile).toMatchObject({
      title: "Head of Design",
      company: "Looply",
      totalExperience: "12 yıl",
      inferredAreas: ["UX"],
    });
    expect(result.current.draft.profile.history).toHaveLength(1);
    expect(result.current.topicOptions).toContain("UX");
    expect(result.current.draft.firstName).toBe("Nihan");
    expect(result.current.parseNote).toBe("");
  });

  it("still opens the form, with a note, when the CV cannot be read", async () => {
    vi.mocked(parseStoredCv).mockRejectedValue(new Error("okunamadı"));
    const { result } = renderHook(() => useMentorOnboarding());

    act(
      () =>
        void result.current.uploadCv({
          name: cvFile.name,
          size: 5,
          file: cvFile,
        }),
    );

    await waitFor(() => expect(result.current.phase).toBe(IntroPhase.Review));
    expect(result.current.parseNote).toContain("CV'nizi okuyamadık");
    expect(result.current.draft.profile.title).toBe("");
  });

  it("goes back to the upload screen when the upload itself fails", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(
      new Error("Dosya yüklenemedi."),
    );
    const { result } = renderHook(() => useMentorOnboarding());

    act(
      () =>
        void result.current.uploadCv({
          name: cvFile.name,
          size: 5,
          file: cvFile,
        }),
    );

    await waitFor(() =>
      expect(result.current.uploadError).toBe("Dosya yüklenemedi."),
    );
    expect(result.current.phase).toBe(IntroPhase.Upload);
  });
});

describe("useMentorOnboarding — sending the profile", () => {
  function readyToSend() {
    const hook = renderHook(() =>
      useMentorOnboarding({ fullName: "Nihan Öztürk" }),
    );
    fillProfile(hook.result);
    fillAreas(hook.result);
    openTuesday(hook.result);
    act(() => {
      hook.result.current.update("linkedin", "linkedin.com/in/nihan");
      hook.result.current.addOffering("Pitch deck incelemesi");
      hook.result.current.update("consent", true);
    });
    return hook;
  }

  it("saves the mentor profile, the availability and the person's own profile with the token", async () => {
    const { result } = readyToSend();

    await act(async () => {
      await result.current.complete();
    });

    expect(updateMentorProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        professionalTitle: "Ürün Direktörü",
        company: "Peak",
        experienceLevel: "9 yıl",
        specialties: ["Ürün stratejisi"],
        startupStages: "MVP",
        offerings: ["Pitch deck incelemesi"],
      }),
      "id-token",
    );
    expect(updateAvailabilitySettings).toHaveBeenCalledWith(
      expect.objectContaining({
        rules: [
          expect.objectContaining({
            dayOfWeek: Weekday.Tuesday,
            startTime: "14:00",
            endTime: "17:00",
          }),
        ],
      }),
      "id-token",
    );
    // Phone and bio are not on this form, so they must survive the save.
    expect(saveUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Nihan Öztürk",
        jobTitle: "Ürün Direktörü",
        linkedinUrl: "linkedin.com/in/nihan",
        phone: "+905551112233",
        bio: "Mevcut biyografi",
      }),
      "id-token",
    );
    expect(result.current.submittedAt).toBeInstanceOf(Date);
    expect(result.current.saveError).toBe("");
  });

  it("surfaces a save failure instead of claiming the profile was sent", async () => {
    vi.mocked(updateAvailabilitySettings).mockRejectedValue(
      new Error("Müsaitlik kaydedilemedi."),
    );
    const { result } = readyToSend();

    await act(async () => {
      await result.current.complete();
    });

    expect(result.current.saveError).toBe("Müsaitlik kaydedilemedi.");
    expect(result.current.submittedAt).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  it("asks the person to sign in again when the token is gone", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);
    const { result } = readyToSend();

    await act(async () => {
      await result.current.complete();
    });

    expect(result.current.saveError).toContain("Oturumunuz sona erdi");
    expect(updateMentorProfile).not.toHaveBeenCalled();
  });
});

describe("useMentorOnboarding — resuming after a refresh", () => {
  it("restores the draft, but never the consent", async () => {
    const first = renderHook(() => useMentorOnboarding());
    await waitFor(() => expect(fetchOnboardingDraft).toHaveBeenCalled());
    act(() => {
      first.result.current.toggleTopic("Finans");
      first.result.current.updateProfile("company", "Peak");
      first.result.current.update("consent", true);
    });
    await act(async () => {
      await first.result.current.saveDraft();
    });
    first.unmount();

    const second = renderHook(() => useMentorOnboarding());

    await waitFor(() =>
      expect(second.result.current.draft.topics).toEqual(["Finans"]),
    );
    expect(second.result.current.draft.profile.company).toBe("Peak");
    expect(second.result.current.draft.consent).toBe(false);
    expect(second.result.current.droppedFiles).toBe(0);
  });

  it("keeps a CV that already reached the server instead of asking for it again", async () => {
    vi.mocked(parseStoredCv).mockResolvedValue({ full_name: "Nihan Öztürk" });
    const first = renderHook(() => useMentorOnboarding());
    await waitFor(() => expect(fetchOnboardingDraft).toHaveBeenCalled());
    act(
      () =>
        void first.result.current.uploadCv({
          name: cvFile.name,
          size: 5,
          file: cvFile,
        }),
    );
    await waitFor(() =>
      expect(first.result.current.phase).toBe(IntroPhase.Review),
    );
    await act(async () => {
      await first.result.current.saveDraft();
    });
    first.unmount();
    vi.mocked(uploadDocument).mockClear();

    const second = renderHook(() => useMentorOnboarding());

    await waitFor(() =>
      expect(second.result.current.draft.cvStoredName).toBe(cvFile.name),
    );
    expect(second.result.current.droppedFiles).toBe(0);
    expect(second.result.current.draft.cv).toBeNull();
  });

  it("forgets the draft once the profile is sent", async () => {
    const first = renderHook(() => useMentorOnboarding());
    await waitFor(() => expect(fetchOnboardingDraft).toHaveBeenCalled());
    act(() => first.result.current.toggleTopic("Finans"));
    await act(async () => {
      await first.result.current.complete();
    });

    expect(clearOnboardingDraft).toHaveBeenCalled();
    expect(stored).toBeNull();
  });
});
