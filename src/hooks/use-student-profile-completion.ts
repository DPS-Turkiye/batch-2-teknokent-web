"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { STUDENT_HOME_QUERY_KEY } from "@/hooks/use-student-home";
import { useStudentInstitution } from "@/hooks/use-student-profile";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  ProfileCompletionStep,
  type StudentProfileCompletion,
} from "@/interfaces/student-profile-completion";
import {
  getProfileCompletionCategories,
  getStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import { PROFILE_PHOTO_MAX_BYTES } from "@/lib/personal-profile";
import {
  completionStepState,
  completionSummary,
  PROFILE_COMPLETION_STEPS,
  stepAfter,
  stepBefore,
  welcomeFacts,
} from "@/lib/profile-completion";
import {
  chosenCategories,
  toggleInterestSubtopic,
  toggleInterestTopic,
} from "@/lib/student-interests";
import { formatFileSize, initials, splitFullName } from "@/lib/utils";

export const PROFILE_COMPLETION_QUERY_KEY = [
  "student-profile-completion",
] as const;
export const PROFILE_COMPLETION_CATEGORIES_QUERY_KEY = [
  "student-profile-completion-categories",
] as const;
/** The wizard's choices: a peer mentor's programs can differ from the program they study in. */
export const PEER_MENTOR_CATEGORIES_QUERY_KEY = [
  "peer-mentor-categories",
] as const;

export function useStudentProfileCompletion() {
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: PROFILE_COMPLETION_QUERY_KEY,
    queryFn: getStudentProfileCompletion,
  });
  const categories = useQuery({
    queryKey: PROFILE_COMPLETION_CATEGORIES_QUERY_KEY,
    queryFn: getProfileCompletionCategories,
  });
  const t = useTranslations("iaProfile.welcome");
  const tLevel = useTranslations("studyLevel");
  const institution = useStudentInstitution();
  const photo = useProfilePhoto();
  const [step, setStep] = useState(ProfileCompletionStep.Welcome);
  const [edits, setEdits] = useState<StudentProfileCompletion | null>(null);
  const draft = edits ?? profile.data;
  const save = useMutation({
    mutationFn: saveStudentProfileCompletion,
    onSuccess: (data) => {
      client.setQueryData(PROFILE_COMPLETION_QUERY_KEY, data);
      void client.invalidateQueries({ queryKey: STUDENT_HOME_QUERY_KEY });
      setEdits(null);
    },
  });
  const change = (
    update: (current: StudentProfileCompletion) => StudentProfileCompletion,
  ) => {
    if (!draft) return;
    save.reset();
    setEdits(update(draft));
  };
  const toggleTopic = (id: PeerTopicCategory) =>
    change((current) =>
      toggleInterestTopic(current, id, categories.data ?? []),
    );
  const toggleSubtopic = (id: string) =>
    change((current) => toggleInterestSubtopic(current, id));
  const finish = (skipped = false) => {
    if (draft)
      save.mutate({
        ...draft,
        goal: draft.goal.trim(),
        completed: !skipped,
        skipped,
      });
  };
  const record = institution.record;
  const fullName = record?.fullName ?? "";
  // A failed save belongs to the step it happened on; moving away clears it.
  const goTo = (target: ProfileCompletionStep) => {
    save.reset();
    setStep(target);
  };
  return {
    step,
    steps: PROFILE_COMPLETION_STEPS.map((item) => ({
      step: item,
      state: completionStepState(item, step),
    })),
    draft,
    categories: categories.data ?? [],
    subtopicGroups: chosenCategories(
      categories.data ?? [],
      draft?.topics ?? [],
    ),
    summary: completionSummary(categories.data ?? [], {
      topics: draft?.topics ?? [],
      subtopics: draft?.subtopics ?? [],
    }),
    /** "ODTÜ'den gelen bilgiler": read-only, and missing for an account no institution vouches for. */
    welcome: {
      firstName: splitFullName(fullName).firstName || null,
      facts: record
        ? welcomeFacts(record, (year, level) => {
            if (year && level)
              return t("classAndLevel", { year, level: tLevel(level) });
            if (year) return t("classOnly", { year });
            return level ? tLevel(level) : null;
          })
        : null,
      isLoading: institution.isLoading,
      missing: institution.missing,
      error: institution.error,
      isFetching: institution.isFetching,
      retry: institution.retry,
    },
    photo: {
      url: photo.photoUrl,
      initials: initials(fullName),
      maxSize: formatFileSize(PROFILE_PHOTO_MAX_BYTES),
      isUploading: photo.isUploading,
      upload: photo.upload,
    },
    isLoading: profile.isLoading || categories.isLoading,
    loadError: profile.error ?? categories.error,
    retry: () => {
      void profile.refetch();
      void categories.refetch();
    },
    isFetching: profile.isFetching || categories.isFetching,
    isSaving: save.isPending,
    saveError: save.error,
    finished: save.isSuccess,
    isLastStep: step === ProfileCompletionStep.Goal,
    toggleTopic,
    toggleSubtopic,
    setGoal: (goal: string) => change((current) => ({ ...current, goal })),
    back: () => goTo(stepBefore(step)),
    /** The footer's main button: the next step, or saving on the last one. */
    advance: () => {
      if (step === ProfileCompletionStep.Goal) finish();
      else goTo(stepAfter(step));
    },
    skip: () => finish(true),
  };
}
