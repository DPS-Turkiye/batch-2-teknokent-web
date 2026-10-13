"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";

import { ClientApiError } from "@/lib/client/api";

// Shared by the personal and startup sections on /profile, so both are
// implemented and tested once: load a record, edit it as a draft, save it back.
export function useEditableProfile<TLoaded, TDraft extends object>({
  queryKey,
  load,
  save,
  toDraft,
  validate,
}: {
  queryKey: readonly unknown[];
  load: () => Promise<TLoaded>;
  save: (draft: TDraft) => Promise<TLoaded>;
  toDraft: (loaded: TLoaded) => TDraft;
  validate: (draft: TDraft) => Partial<Record<keyof TDraft, string>>;
}) {
  const t = useTranslations("profileSections");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  // Wrapped so React Query's context never reaches a loader's optional
  // arguments: getUserProfile would send it as its bearer token.
  const query = useQuery({ queryKey, queryFn: () => load() });

  // The draft is derived from the loaded record plus the user's edits rather
  // than copied into state by an effect: nothing has to re-sync when the query
  // refetches, and a save simply clears the edits.
  const [edits, setEdits] = useState<Partial<TDraft>>({});
  const [saved, setSaved] = useState(false);

  const {
    mutate,
    isPending: isSaving,
    error: saveError,
    reset: resetSave,
  } = useMutation({
    // Same for the mutation context, which would land in saveUserProfile's token.
    mutationFn: (draft: TDraft) => save(draft),
    onSuccess: (loaded) => {
      queryClient.setQueryData(queryKey, loaded);
      setEdits({});
      setSaved(true);
      showToast({ message: t("savedToast"), tone: "success" });
    },
    onError: () => showToast({ message: t("saveFailedToast"), tone: "error" }),
  });

  const loaded = query.data;
  const draft = useMemo(
    () => (loaded ? { ...toDraft(loaded), ...edits } : null),
    [loaded, edits, toDraft],
  );
  const clientFieldErrors = useMemo(
    () => (draft ? validate(draft) : {}),
    [draft, validate],
  );
  const serverFieldErrors =
    saveError instanceof ClientApiError ? saveError.fieldErrors : {};
  const fieldErrors = { ...serverFieldErrors, ...clientFieldErrors } as Partial<
    Record<keyof TDraft, string>
  >;

  // A save confirmation that never clears reads as stale the moment the user
  // edits again, so the next change retires it.
  const setField = useCallback(
    <K extends keyof TDraft>(field: K, value: TDraft[K]) => {
      setSaved(false);
      resetSave();
      setEdits((current) => ({ ...current, [field]: value }));
    },
    [resetSave],
  );

  const discard = useCallback(() => {
    setEdits({});
    setSaved(false);
    resetSave();
  }, [resetSave]);

  const isDirty = useMemo(
    () =>
      Boolean(
        loaded && JSON.stringify(toDraft(loaded)) !== JSON.stringify(draft),
      ),
    [loaded, draft, toDraft],
  );

  const submit = useCallback(() => {
    if (!draft || Object.keys(validate(draft)).length) return;
    mutate(draft);
  }, [draft, mutate, validate]);

  return {
    draft,
    setField,
    save: submit,
    discard,
    isDirty,
    saved,
    isLoading: query.isLoading,
    isSaving,
    // The load error blocks the form; a save error sits beside it.
    loadError: query.error?.message ?? null,
    saveError: saveError?.message ?? null,
    fieldErrors,
    canSave:
      Boolean(draft && Object.keys(clientFieldErrors).length === 0) &&
      isDirty &&
      !isSaving,
  };
}
