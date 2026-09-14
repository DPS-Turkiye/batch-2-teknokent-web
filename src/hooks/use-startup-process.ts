"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import {
  getStartupProcess,
  submitAssignment,
} from "@/lib/client/startup-process";

export const STARTUP_PROCESS_QUERY_KEY = ["startup-process"] as const;

/** The Süreç tab: the stage tracker, the focus round and its Ödevler. */
export function useStartupProcess() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
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
      showToast({ message: "Ödev yüklendi.", tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: error instanceof Error ? error.message : "Ödev yüklenemedi.",
        tone: "error",
      }),
  });

  const process = query.data ?? null;
  const currentRound = process?.currentRound ?? null;
  // A round focuses the list on its own Ödevler; without one, show them all.
  const assignments = useMemo(
    () =>
      (process?.assignments ?? []).filter(
        (assignment) => !currentRound || assignment.roundId === currentRound.id,
      ),
    [process, currentRound],
  );

  return {
    assignments,
    currentRound,
    error: query.error,
    isLoading: query.isLoading,
    stages: process?.stages ?? [],
    uploadAssignment: (assignmentId: string, file: File) =>
      upload.mutate({ assignmentId, file }),
    uploadingAssignmentId: upload.isPending
      ? (upload.variables?.assignmentId ?? null)
      : null,
  };
}
