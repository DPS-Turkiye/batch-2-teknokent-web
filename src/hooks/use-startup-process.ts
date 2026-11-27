"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

import { DocumentKind } from "@/interfaces/startup-document";
import { ToastTone } from "@/interfaces/toast";
import {
  isUploadCanceled,
  uploadCanceledError,
  uploadDocumentWithProgress,
} from "@/lib/client/documents";
import {
  getStartupProcess,
  submitAssignment,
} from "@/lib/client/startup-process";
import {
  completedPhases,
  focusedSelection,
  phaseCards,
  roundForPhase,
  unphasedAssignments,
} from "@/lib/startup-process";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const STARTUP_PROCESS_QUERY_KEY = ["startup-process"] as const;

/**
 * The team's Süreç for lists that only read it (home, phone tasks). A mentee outside a startup has no process;
 * that is not an error there, so it is not retried.
 */
export function useTeamProcessQuery() {
  return useQuery({
    queryKey: STARTUP_PROCESS_QUERY_KEY,
    queryFn: getStartupProcess,
    retry: false,
  });
}

/**
 * The Süreç tab: one card per phase of the team's program, the chosen phase's round and its Ödevler. Without
 * phases the Ödevler are one flat list; those no phase covers are listed under "Fazsız görevler".
 */
export function useStartupProcess(focusAssignmentId: string | null = null) {
  const t = useTranslations("startupProcess");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [pickedPhaseId, setPickedPhaseId] = useState<string | null>(null);
  const [showUnphased, setShowUnphased] = useState(false);
  // A linked Ödev picks the phase until the user picks another view themselves.
  const [focusReleased, setFocusReleased] = useState(false);
  // How much of the file being uploaded has gone out (0–1), while an upload runs.
  const [uploadSent, setUploadSent] = useState<number | null>(null);
  // Stops the running upload (İptal); one upload runs at a time.
  const uploadAbort = useRef<AbortController | null>(null);
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
      /** A handed-in file being swapped for this one. */
      replacing: boolean;
    }) => {
      const controller = new AbortController();
      uploadAbort.current = controller;
      const stored = await uploadDocumentWithProgress(
        file,
        DocumentKind.Homework,
        { onProgress: setUploadSent, signal: controller.signal },
      );
      // Stopped after the file went out: it is not handed in.
      if (controller.signal.aborted) throw uploadCanceledError();
      return submitAssignment(assignmentId, stored.id);
    },
    onMutate: () => setUploadSent(0),
    onSettled: () => {
      setUploadSent(null);
      uploadAbort.current = null;
    },
    onSuccess: (process, { replacing }) => {
      queryClient.setQueryData(STARTUP_PROCESS_QUERY_KEY, process);
      showToast({
        message: replacing ? t("replaced") : t("uploaded"),
        tone: ToastTone.Success,
      });
    },
    onError: (error, { replacing }) => {
      if (isUploadCanceled(error)) {
        showToast({ message: t("uploadCanceled"), tone: ToastTone.Info });
        return;
      }
      showToast({
        message: errorMessage(
          error,
          replacing ? t("replaceFailed") : t("uploadFailed"),
        ),
        tone: ToastTone.Error,
      });
      // A swap refused after the due day leaves a stale "Değiştir"; reload so it goes.
      if (replacing) {
        void queryClient.invalidateQueries({
          queryKey: STARTUP_PROCESS_QUERY_KEY,
        });
      }
    },
  });

  const markDone = useMutation({
    mutationFn: (assignmentId: string) => submitAssignment(assignmentId, null),
    onSuccess: (process) => {
      queryClient.setQueryData(STARTUP_PROCESS_QUERY_KEY, process);
      showToast({ message: t("markedDone"), tone: ToastTone.Success });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("markDoneFailed")),
        tone: ToastTone.Error,
      }),
  });

  const process = query.data ?? null;
  const hasPhases = (process?.phases.length ?? 0) > 0;
  const focus =
    process && !focusReleased
      ? focusedSelection(process, focusAssignmentId)
      : null;
  const unphasedShown = showUnphased || (focus?.unphased ?? false);
  // The current phase is open until a card is picked; a picked phase that is gone falls back to it.
  const picked = process?.phases.some((phase) => phase.id === pickedPhaseId)
    ? pickedPhaseId
    : null;
  const selectedPhaseId =
    picked ??
    focus?.phaseId ??
    process?.currentPhaseId ??
    process?.phases[0]?.id ??
    null;
  const allAssignments = useMemo(() => process?.assignments ?? [], [process]);
  const unphased = useMemo(
    () => unphasedAssignments(allAssignments),
    [allAssignments],
  );
  const assignments = useMemo(() => {
    if (!hasPhases || showAll) return allAssignments;
    if (unphasedShown) return unphased;
    return allAssignments.filter(
      (assignment) => assignment.phaseId === selectedPhaseId,
    );
  }, [
    allAssignments,
    hasPhases,
    selectedPhaseId,
    showAll,
    unphasedShown,
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
      : unphasedShown
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
    // Outlined only while the link still decides what is shown.
    focusedAssignmentId:
      !focusReleased &&
      focusAssignmentId &&
      allAssignments.some((assignment) => assignment.id === focusAssignmentId)
        ? focusAssignmentId
        : null,
    selectPhase: (phaseId: string) => {
      setFocusReleased(true);
      setPickedPhaseId(phaseId);
      setShowAll(false);
      setShowUnphased(false);
    },
    selectedPhaseId: unphasedShown ? null : selectedPhaseId,
    selectedRound:
      process && selectedPhaseId && !unphasedShown
        ? roundForPhase(process, selectedPhaseId)
        : null,
    showAll,
    showUnphased: unphasedShown,
    selectUnphased: () => {
      setFocusReleased(true);
      setShowUnphased(true);
      setShowAll(false);
    },
    toggleShowAll: () => {
      setFocusReleased(true);
      setShowAll((current) => !current);
      setShowUnphased(false);
    },
    unphasedCount: hasPhases ? unphased.length : 0,
    totalAssignments: allAssignments.length,
    uploadAssignment: (assignmentId: string, file: File) =>
      upload.mutate({ assignmentId, file, replacing: false }),
    /** Swaps a handed-in file; the backend refuses once the due day is over. */
    replaceSubmission: (assignmentId: string, file: File) =>
      upload.mutate({ assignmentId, file, replacing: true }),
    uploadingAssignmentId: upload.isPending
      ? upload.variables.assignmentId
      : null,
    /** Stops the running upload; nothing is handed in. */
    cancelUpload: () => uploadAbort.current?.abort(),
    /** The share of the running upload sent so far, 0–100; null when nothing is uploading. */
    uploadPercent:
      upload.isPending && uploadSent !== null
        ? Math.round(uploadSent * 100)
        : null,
    /** A program Ödev that asks for no file is handed in by marking it done. */
    markDone: (assignmentId: string) => markDone.mutate(assignmentId),
    markingAssignmentId: markDone.isPending ? markDone.variables : null,
  };
}
