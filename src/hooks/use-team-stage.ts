"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import { StartupStage } from "@/interfaces/startup-process";
import { getTeamProcess, updateTeamStage } from "@/lib/client/startup-process";
import { STARTUP_STAGE_LABELS } from "@/lib/startup-process";

const STAGE_OPTIONS = Object.values(StartupStage).map((stage) => ({
  stage,
  label: STARTUP_STAGE_LABELS[stage],
}));

/** "Aşamayı güncelle" in the Takımlar drawer: a coordinator moves a team to another stage. */
export function useTeamStage(programId: string, organizationId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const queryKey = [
    ...programTeamsQueryKey(programId),
    "stage",
    organizationId,
  ];
  // Non-null while the picker is open.
  const [draft, setDraft] = useState<StartupStage | null>(null);

  const query = useQuery({
    queryKey,
    queryFn: () => getTeamProcess(programId, organizationId),
  });
  const save = useMutation({
    mutationFn: (stage: StartupStage) =>
      updateTeamStage(programId, organizationId, stage),
    onSuccess: (process) => {
      queryClient.setQueryData(queryKey, process);
      setDraft(null);
      showToast({ message: "Aşama güncellendi.", tone: "success" });
    },
  });

  const current = query.data?.currentStage ?? null;

  return {
    currentLabel: current ? STARTUP_STAGE_LABELS[current] : null,
    isLoading: query.isLoading,
    loadFailed: Boolean(query.error),
    options: STAGE_OPTIONS,
    draft,
    isEditing: draft !== null,
    startEditing: () => {
      save.reset();
      setDraft(current ?? StartupStage.Problem);
    },
    cancelEditing: () => setDraft(null),
    pick: setDraft,
    canSave: draft !== null && draft !== current && !save.isPending,
    save: () => {
      if (draft) save.mutate(draft);
    },
    isSaving: save.isPending,
    saveFailed: Boolean(save.error),
  };
}
