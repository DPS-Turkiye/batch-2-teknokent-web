"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { useInstitutionRecord } from "@/hooks/use-institution-record";
import { STUDENT_HOME_QUERY_KEY } from "@/hooks/use-student-home";
import {
  PROFILE_COMPLETION_CATEGORIES_QUERY_KEY,
  PROFILE_COMPLETION_QUERY_KEY,
} from "@/hooks/use-student-profile-completion";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import type { StudentProfileCompletion } from "@/interfaces/student-profile-completion";
import { ClientApiError } from "@/lib/client/api";
import {
  getProfileCompletionCategories,
  getStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import {
  chosenCategories,
  toggleInterestSubtopic,
  toggleInterestTopic,
} from "@/lib/student-interests";

/**
 * Profilim › Kurumsal Bilgiler. The backend answers 404 when no institution vouches for the
 * account (an e-mail sign-up), which is a state to show, not an error.
 */
export function useStudentInstitution() {
  const query = useInstitutionRecord();
  const missing =
    query.error instanceof ClientApiError && query.error.status === 404;
  return {
    record: query.data ?? null,
    isLoading: query.isLoading,
    missing,
    error: missing ? null : query.error,
    isFetching: query.isFetching,
    retry: () => void query.refetch(),
  };
}

/** Profilim › İlgi alanların: the profile-completion answers, viewed and edited in place. */
export function useStudentInterests() {
  const t = useTranslations("odtuWorkspaces.student.profile.interests");
  const { showToast } = useToast();
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: PROFILE_COMPLETION_QUERY_KEY,
    queryFn: getStudentProfileCompletion,
  });
  const categories = useQuery({
    queryKey: PROFILE_COMPLETION_CATEGORIES_QUERY_KEY,
    queryFn: getProfileCompletionCategories,
  });
  const [draft, setDraft] = useState<StudentProfileCompletion | null>(null);
  const save = useMutation({
    mutationFn: saveStudentProfileCompletion,
    onSuccess: (data) => {
      client.setQueryData(PROFILE_COMPLETION_QUERY_KEY, data);
      void client.invalidateQueries({ queryKey: STUDENT_HOME_QUERY_KEY });
      setDraft(null);
      showToast({ message: t("saved"), tone: "success" });
    },
  });
  const catalogue = categories.data ?? [];
  const saved = profile.data ?? null;
  const shown = draft ?? saved;

  const change = (
    update: (current: StudentProfileCompletion) => StudentProfileCompletion,
  ) => {
    save.reset();
    setDraft((current) => (current ? update(current) : current));
  };

  return {
    saved,
    draft,
    editing: draft != null,
    categories: catalogue,
    /** The chosen categories with their sub-topics, for whatever is on screen. */
    chosen: chosenCategories(catalogue, shown?.topics ?? []),
    isLoading: profile.isLoading || categories.isLoading,
    loadError: profile.error ?? categories.error,
    isFetching: profile.isFetching || categories.isFetching,
    retry: () => {
      void profile.refetch();
      void categories.refetch();
    },
    startEditing: () => {
      if (saved) setDraft(structuredClone(saved));
    },
    cancel: () => {
      save.reset();
      setDraft(null);
    },
    toggleTopic: (id: PeerTopicCategory) =>
      change((current) => toggleInterestTopic(current, id, catalogue)),
    toggleSubtopic: (id: string) =>
      change((current) => toggleInterestSubtopic(current, id)),
    setGoal: (goal: string) => change((current) => ({ ...current, goal })),
    isSaving: save.isPending,
    saveError: save.error,
    // Saving here counts as having been through the profile completion.
    save: () => {
      if (draft) {
        save.mutate({
          ...draft,
          goal: draft.goal.trim(),
          completed: true,
          skipped: false,
        });
      }
    },
  };
}
