"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  replaceCoordinatorProgramPhases,
  setCoordinatorProgramArchived,
  updateCoordinatorProgram,
} from "@/lib/client/coordinator-programs";
import {
  detailsInput,
  emptyPhase,
  MAX_PHASES,
  movePhase,
  type PhaseDraft,
  phasesChanged,
  phasesInput,
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

function useProgramCache(programId: string) {
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
  const cache = useProgramCache(programId);
  const { showToast } = useToast();
  const [section, setSection] = useState(SettingsSection.General);
  const [draft, setDraft] = useState<ProgramSettingsDraft>(() =>
    settingsDraftOf(detail),
  );
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (value: ProgramSettingsDraft) => {
      let saved = await updateCoordinatorProgram(
        programId,
        detailsInput(value),
      );
      if (phasesChanged(value, detail)) {
        saved = await replaceCoordinatorProgramPhases(
          programId,
          phasesInput(value),
        );
      }
      return saved;
    },
    onSuccess: (saved) => {
      cache.put(saved);
      setDraft(settingsDraftOf(saved));
      showToast({ message: "Program ayarları kaydedildi.", tone: "success" });
    },
    onError: (failure) =>
      setError(errorMessage(failure, "Program ayarları kaydedilemedi.")),
  });

  const update = (patch: Partial<ProgramSettingsDraft>) => {
    setError(null);
    setDraft((current) => ({ ...current, ...patch }));
  };
  const updatePhase = (key: string, patch: Partial<PhaseDraft>) =>
    update({
      phases: draft.phases.map((phase) =>
        phase.key === key ? { ...phase, ...patch } : phase,
      ),
    });

  return {
    section,
    setSection,
    draft,
    update,
    updatePhase,
    addPhase: () =>
      draft.phases.length < MAX_PHASES &&
      update({ phases: [...draft.phases, emptyPhase()] }),
    removePhase: (key: string) =>
      update({ phases: draft.phases.filter((phase) => phase.key !== key) }),
    movePhase: (index: number, step: -1 | 1) =>
      update({ phases: movePhase(draft.phases, index, step) }),
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
      message: errorMessage(failure, "Koordinatör güncellenemedi."),
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
        message: value ? "Program arşivlendi." : "Program yeniden açıldı.",
        tone: "success",
      });
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, "Program arşivlenemedi."),
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
