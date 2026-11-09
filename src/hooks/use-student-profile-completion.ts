"use client";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ProfileCompletionStep,
  type StudentProfileCompletion,
} from "@/interfaces/student-profile-completion";
import {
  getStudentProfileCompletion,
  getProfileCompletionCategories,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import { STUDENT_HOME_QUERY_KEY } from "@/hooks/use-student-home";
import {
  chosenCategories,
  toggleInterestSubtopic,
  toggleInterestTopic,
} from "@/lib/student-interests";

export const PROFILE_COMPLETION_QUERY_KEY = [
  "student-profile-completion",
] as const;
export const PROFILE_COMPLETION_CATEGORIES_QUERY_KEY = [
  "student-profile-completion-categories",
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
  const [step, setStep] = useState(ProfileCompletionStep.Topics);
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
  return {
    step,
    draft,
    categories: categories.data ?? [],
    subtopicGroups: chosenCategories(
      categories.data ?? [],
      draft?.topics ?? [],
    ),
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
    toggleTopic,
    toggleSubtopic,
    setGoal: (goal: string) => change((current) => ({ ...current, goal })),
    next: () =>
      setStep((current) => Math.min(ProfileCompletionStep.Goal, current + 1)),
    back: () =>
      setStep((current) => Math.max(ProfileCompletionStep.Topics, current - 1)),
    finish: () => finish(),
    skip: () => finish(true),
  };
}
