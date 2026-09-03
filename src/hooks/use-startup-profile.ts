"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  StartupProfile,
  StartupProfileInput,
} from "@/interfaces/organization";
import {
  getStartupProfile,
  saveStartupProfile,
} from "@/lib/client/organization";

export const STARTUP_PROFILE_QUERY_KEY = ["startup-profile"] as const;

/** The free-text fields, so the form can drive them all through one setter. */
export type StartupProfileField = Exclude<
  keyof StartupProfileInput,
  "supportAreas"
>;

function toDraft(profile: StartupProfile): StartupProfileInput {
  return {
    name: profile.name,
    description: profile.description,
    website: profile.website,
    problem: profile.problem,
    solution: profile.solution,
    currentSolution: profile.currentSolution,
    targetUser: profile.targetUser,
    sector: profile.sector,
    maturity: profile.maturity,
    programLevel: profile.programLevel,
    supportAreas: profile.supportAreas,
  };
}

export function useStartupProfile() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: STARTUP_PROFILE_QUERY_KEY,
    queryFn: getStartupProfile,
  });

  // The draft is derived from the loaded profile plus the user's edits rather
  // than copied into state by an effect: nothing has to re-sync when the query
  // refetches, and a save simply clears the edits.
  const [edits, setEdits] = useState<Partial<StartupProfileInput>>({});
  const [saved, setSaved] = useState(false);

  const {
    mutate,
    isPending: isSaving,
    error: saveError,
  } = useMutation({
    mutationFn: saveStartupProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(STARTUP_PROFILE_QUERY_KEY, profile);
      setEdits({});
      setSaved(true);
    },
  });

  const loaded = profileQuery.data;
  const draft = useMemo(
    () => (loaded ? { ...toDraft(loaded), ...edits } : null),
    [loaded, edits],
  );

  // A save confirmation that never clears reads as stale the moment the user
  // edits again, so the next keystroke retires it.
  const setField = useCallback((field: StartupProfileField, value: string) => {
    setSaved(false);
    setEdits((current) => ({ ...current, [field]: value }));
  }, []);

  const setSupportAreas = useCallback((supportAreas: string[]) => {
    setSaved(false);
    setEdits((current) => ({ ...current, supportAreas }));
  }, []);

  const isDirty = useMemo(
    () =>
      Boolean(
        loaded && JSON.stringify(toDraft(loaded)) !== JSON.stringify(draft),
      ),
    [loaded, draft],
  );

  const save = useCallback(() => {
    if (!draft?.name.trim()) return;
    mutate(draft);
  }, [draft, mutate]);

  return {
    draft,
    setField,
    setSupportAreas,
    save,
    isDirty,
    saved,
    isLoading: profileQuery.isLoading,
    isSaving,
    // The load error is the one that blocks the form; a save error sits beside it.
    loadError: profileQuery.error?.message ?? null,
    saveError: saveError?.message ?? null,
    canSave: Boolean(draft?.name.trim()) && isDirty && !isSaving,
  };
}
