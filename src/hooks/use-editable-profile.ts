"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";

// Shared by the personal and startup sections on /profile, so both are
// implemented and tested once: load a record, edit it as a draft, save it back.
export function useEditableProfile<TLoaded, TDraft extends object>({
  queryKey,
  load,
  save,
  toDraft,
  isValid,
}: {
  queryKey: readonly unknown[];
  load: () => Promise<TLoaded>;
  save: (draft: TDraft) => Promise<TLoaded>;
  toDraft: (loaded: TLoaded) => TDraft;
  isValid: (draft: TDraft) => boolean;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({ queryKey, queryFn: load });

  // The draft is derived from the loaded record plus the user's edits rather
  // than copied into state by an effect: nothing has to re-sync when the query
  // refetches, and a save simply clears the edits.
  const [edits, setEdits] = useState<Partial<TDraft>>({});
  const [saved, setSaved] = useState(false);

  const {
    mutate,
    isPending: isSaving,
    error: saveError,
  } = useMutation({
    mutationFn: save,
    onSuccess: (loaded) => {
      queryClient.setQueryData(queryKey, loaded);
      setEdits({});
      setSaved(true);
      showToast({ message: "Değişiklikleriniz kaydedildi.", tone: "success" });
    },
    onError: () =>
      showToast({ message: "Değişiklikler kaydedilemedi.", tone: "error" }),
  });

  const loaded = query.data;
  const draft = useMemo(
    () => (loaded ? { ...toDraft(loaded), ...edits } : null),
    [loaded, edits, toDraft],
  );

  // A save confirmation that never clears reads as stale the moment the user
  // edits again, so the next change retires it.
  const setField = useCallback(
    <K extends keyof TDraft>(field: K, value: TDraft[K]) => {
      setSaved(false);
      setEdits((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const isDirty = useMemo(
    () =>
      Boolean(
        loaded && JSON.stringify(toDraft(loaded)) !== JSON.stringify(draft),
      ),
    [loaded, draft, toDraft],
  );

  const submit = useCallback(() => {
    if (!draft || !isValid(draft)) return;
    mutate(draft);
  }, [draft, isValid, mutate]);

  return {
    draft,
    setField,
    save: submit,
    isDirty,
    saved,
    isLoading: query.isLoading,
    isSaving,
    // The load error blocks the form; a save error sits beside it.
    loadError: query.error?.message ?? null,
    saveError: saveError?.message ?? null,
    canSave: Boolean(draft && isValid(draft)) && isDirty && !isSaving,
  };
}
