"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DocumentKind } from "@/interfaces/startup-document";
import type { StartupStage } from "@/interfaces/startup-process";
import { ToastTone } from "@/interfaces/toast";
import { uploadDocument } from "@/lib/client/documents";
import {
  getStartupProcess,
  submitAssignment,
} from "@/lib/client/startup-process";
import {
  completedStages,
  roundForStage,
  stageCards,
} from "@/lib/startup-process";
import { useToast } from "@/stores/toast-store";

export const STARTUP_PROCESS_QUERY_KEY = ["startup-process"] as const;

/** The Süreç tab: the stage cards, the chosen stage's round and its Ödevler. */
export function useStartupProcess() {
  const t = useTranslations("startupProcess");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [pickedStage, setPickedStage] = useState<StartupStage | null>(null);
  const query = useQuery({
    queryKey: STARTUP_PROCESS_QUERY_KEY,
    queryFn: getStartupProcess,
  });

  const upload = useMutation({
    mutationFn: async ({
      assignmentId,
      file,
    }: {
      assignmentId: string;
      file: File;
    }) => {
      const stored = await uploadDocument(file, DocumentKind.Homework);
      return submitAssignment(assignmentId, stored.id);
    },
    onSuccess: (process) => {
      queryClient.setQueryData(STARTUP_PROCESS_QUERY_KEY, process);
      showToast({ message: t("uploaded"), tone: ToastTone.Success });
    },
    onError: (error) =>
      showToast({
        message: error instanceof Error ? error.message : t("uploadFailed"),
        tone: ToastTone.Error,
      }),
  });

  const process = query.data ?? null;
  // The current stage is open until a card is picked.
  const selectedStage =
    pickedStage ?? process?.currentStage ?? process?.stages[0]?.stage ?? null;
  const allAssignments = useMemo(() => process?.assignments ?? [], [process]);
  const assignments = useMemo(
    () =>
      showAll || !selectedStage
        ? allAssignments
        : allAssignments.filter(
            (assignment) => assignment.stage === selectedStage,
          ),
    [allAssignments, selectedStage, showAll],
  );
  const roundNames = useMemo(
    () =>
      new Map((process?.rounds ?? []).map((round) => [round.id, round.name])),
    [process],
  );
  const stagesDone = useMemo(
    () => (process ? completedStages(process) : []),
    [process],
  );
  const cards = useMemo(() => (process ? stageCards(process) : []), [process]);

  return {
    assignments,
    completedStages: stagesDone,
    error: query.error,
    isLoading: query.isLoading,
    roundName: (roundId: string | null) =>
      roundId ? (roundNames.get(roundId) ?? null) : null,
    selectStage: (stage: StartupStage) => {
      setPickedStage(stage);
      setShowAll(false);
    },
    selectedRound:
      process && selectedStage ? roundForStage(process, selectedStage) : null,
    selectedStage,
    showAll,
    stageCards: cards,
    toggleShowAll: () => setShowAll((current) => !current),
    totalAssignments: allAssignments.length,
    uploadAssignment: (assignmentId: string, file: File) =>
      upload.mutate({ assignmentId, file }),
    uploadingAssignmentId: upload.isPending
      ? upload.variables.assignmentId
      : null,
  };
}
