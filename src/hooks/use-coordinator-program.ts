"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { COORDINATOR_PROGRAMS_QUERY_KEY } from "@/hooks/use-coordinator-programs";
import type {
  CoordinatorProgramDetail,
  CoordinatorRef,
} from "@/interfaces/coordinator-program";
import {
  addProgramCoordinator,
  getCoordinatorProgram,
  getProgramCoordinatorCandidates,
  removeProgramCoordinator,
  setCoordinatorProgramArchived,
  updateCoordinatorProgram,
} from "@/lib/client/coordinator-programs";
import {
  detailsInput,
  type ProgramSettingsDraft,
  SettingsSection,
  settingsDraftError,
  settingsDraftOf,
} from "@/lib/coordinator-program-detail";
import { errorMessage } from "@/lib/utils";

export const coordinatorProgramQueryKey = (programId: string) =>
  ["coordinator-program", programId] as const;

export function useCoordinatorProgram(programId: string) {
  return useQuery({
    queryKey: coordinatorProgramQueryKey(programId),
    queryFn: () => getCoordinatorProgram(programId),
  });
}

export function useProgramCache(programId: string) {
  const queryClient = useQueryClient();
  return {
    put: (detail: CoordinatorProgramDetail) => {
      queryClient.setQueryData(coordinatorProgramQueryKey(programId), detail);
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_PROGRAMS_QUERY_KEY,
      });
    },
    refresh: () =>
      queryClient.invalidateQueries({
        queryKey: coordinatorProgramQueryKey(programId),
      }),
  };
}

/** Genel bilgiler and Mentorluk kuralları share one draft and one "Değişiklikleri kaydet". */
export function useProgramSettings(
  programId: string,
  detail: CoordinatorProgramDetail,
) {
  const t = useTranslations("programSettings");
  const cache = useProgramCache(programId);
  const { showToast } = useToast();
  const [section, setSection] = useState(SettingsSection.General);
  const [draft, setDraft] = useState<ProgramSettingsDraft>(() =>
    settingsDraftOf(detail),
  );
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (value: ProgramSettingsDraft) =>
      updateCoordinatorProgram(programId, detailsInput(value)),
    onSuccess: (saved) => {
      cache.put(saved);
      setDraft(settingsDraftOf(saved));
      showToast({ message: t("saved"), tone: "success" });
    },
    onError: (failure) => setError(errorMessage(failure, t("saveFailed"))),
  });

  const update = (patch: Partial<ProgramSettingsDraft>) => {
    setError(null);
    setDraft((current) => ({ ...current, ...patch }));
  };

  return {
    section,
    setSection,
    draft,
    update,
    dirty: JSON.stringify(draft) !== JSON.stringify(settingsDraftOf(detail)),
    error,
    saving: save.isPending,
    save: () => {
      const problem = settingsDraftError(draft);
      setError(problem);
      if (!problem) save.mutate(draft);
    },
    cancel: () => {
      setError(null);
      setDraft(settingsDraftOf(detail));
    },
  };
}

/** Koordinatörler: who runs the program, and adding or removing the others. */
export function useProgramCoordinators(
  programId: string,
  coordinators: CoordinatorRef[],
) {
  const t = useTranslations("programSettings");
  const cache = useProgramCache(programId);
  const { showToast } = useToast();
  const [picking, setPicking] = useState(false);
  const candidates = useQuery({
    queryKey: [...coordinatorProgramQueryKey(programId), "candidates"],
    queryFn: () => getProgramCoordinatorCandidates(programId),
    enabled: picking,
  });
  const onError = (failure: Error) =>
    showToast({
      message: errorMessage(failure, t("coordinatorFailed")),
      tone: "error",
    });
  const add = useMutation({
    mutationFn: (userId: string) => addProgramCoordinator(programId, userId),
    onSuccess: () => {
      setPicking(false);
      void cache.refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeProgramCoordinator(programId, userId),
    onSuccess: () => void cache.refresh(),
    onError,
  });
  return {
    coordinators,
    picking,
    openPicker: () => setPicking(true),
    closePicker: () => setPicking(false),
    candidates: candidates.data ?? [],
    candidatesLoading: candidates.isLoading,
    add: (userId: string) => add.mutate(userId),
    remove: (userId: string) => remove.mutate(userId),
    busy: add.isPending || remove.isPending,
  };
}

/** Arşiv: archiving asks for confirmation; restoring does not. */
export function useProgramArchive(programId: string, archived: boolean) {
  const t = useTranslations("programSettings");
  const cache = useProgramCache(programId);
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const mutation = useMutation({
    mutationFn: (value: boolean) =>
      setCoordinatorProgramArchived(programId, value),
    onSuccess: (saved, value) => {
      cache.put(saved);
      setConfirming(false);
      showToast({
        message: value ? t("archived") : t("reopened"),
        tone: "success",
      });
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, t("archiveFailed")),
        tone: "error",
      }),
  });
  return {
    archived,
    confirming,
    ask: () => setConfirming(true),
    cancel: () => setConfirming(false),
    archive: () => mutation.mutate(true),
    restore: () => mutation.mutate(false),
    busy: mutation.isPending,
  };
}
