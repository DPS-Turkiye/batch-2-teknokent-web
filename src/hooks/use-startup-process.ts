"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DocumentKind } from "@/interfaces/startup-document";
import { ToastTone } from "@/interfaces/toast";
import { uploadDocument } from "@/lib/client/documents";
import {
  getStartupProcess,
  submitAssignment,
} from "@/lib/client/startup-process";
import {
  completedPhases,
  phaseCards,
  roundForPhase,
  unphasedAssignments,
} from "@/lib/startup-process";
import { useToast } from "@/stores/toast-store";

export const STARTUP_PROCESS_QUERY_KEY = ["startup-process"] as const;

/**
 * The Süreç tab: one card per phase of the team's program, the chosen phase's round and its Ödevler. Without
 * phases the Ödevler are one flat list; those no phase covers are listed under "Fazsız görevler".
 */
export function useStartupProcess() {
  const t = useTranslations("startupProcess");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [pickedPhaseId, setPickedPhaseId] = useState<string | null>(null);
  const [showUnphased, setShowUnphased] = useState(false);
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
  const hasPhases = (process?.phases.length ?? 0) > 0;
  // The current phase is open until a card is picked.
  const selectedPhaseId =
    pickedPhaseId ?? process?.currentPhaseId ?? process?.phases[0]?.id ?? null;
  const allAssignments = useMemo(() => process?.assignments ?? [], [process]);
  const unphased = useMemo(
    () => unphasedAssignments(allAssignments),
    [allAssignments],
  );
  const assignments = useMemo(() => {
    if (!hasPhases || showAll) return allAssignments;
    if (showUnphased) return unphased;
    return allAssignments.filter(
      (assignment) => assignment.phaseId === selectedPhaseId,
    );
  }, [
    allAssignments,
    hasPhases,
    selectedPhaseId,
    showAll,
    showUnphased,
    unphased,
  ]);
  const roundNames = useMemo(
    () =>
      new Map((process?.rounds ?? []).map((round) => [round.id, round.name])),
    [process],
  );
  const phasesDone = useMemo(
    () => (process ? completedPhases(process) : []),
    [process],
  );
  const cards = useMemo(() => (process ? phaseCards(process) : []), [process]);

  const assignmentsTitle =
    !hasPhases || showAll
      ? t("allAssignmentsTitle")
      : showUnphased
        ? t("unphasedTitle")
        : t("assignments");

  return {
    assignments,
    assignmentsTitle,
    completedPhases: phasesDone,
    error: query.error,
    isLoading: query.isLoading,
    roundName: (roundId: string | null) =>
      roundId ? (roundNames.get(roundId) ?? null) : null,
    hasPhases,
    phaseCards: cards,
    selectPhase: (phaseId: string) => {
      setPickedPhaseId(phaseId);
      setShowAll(false);
      setShowUnphased(false);
    },
    selectedPhaseId: showUnphased ? null : selectedPhaseId,
    selectedRound:
      process && selectedPhaseId && !showUnphased
        ? roundForPhase(process, selectedPhaseId)
        : null,
    showAll,
    showUnphased,
    selectUnphased: () => {
      setShowUnphased(true);
      setShowAll(false);
    },
    toggleShowAll: () => {
      setShowAll((current) => !current);
      setShowUnphased(false);
    },
    unphasedCount: hasPhases ? unphased.length : 0,
    totalAssignments: allAssignments.length,
    uploadAssignment: (assignmentId: string, file: File) =>
      upload.mutate({ assignmentId, file }),
    uploadingAssignmentId: upload.isPending
      ? upload.variables.assignmentId
      : null,
  };
}
