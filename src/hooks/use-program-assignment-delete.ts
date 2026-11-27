"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PROGRAM_ASSIGNMENTS_QUERY_KEY } from "@/hooks/use-program-assignments";
import type { ProgramAssignment } from "@/interfaces/program-assignment";
import { ToastTone } from "@/interfaces/toast";
import { deleteProgramAssignment } from "@/lib/client/program-assignments";
import { teamsWithFiles } from "@/lib/program-assignments";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

/**
 * Program › Ödevler › "Sil": the Ödev, every team's copy and their uploaded files, after a confirm. The confirm reads
 * the Ödev from the live list, refetched on open, so its count of teams with a file is current.
 */
export function useProgramAssignmentDelete(
  programId: string,
  assignments: ProgramAssignment[],
) {
  const t = useTranslations("programAssignments");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleting =
    assignments.find((assignment) => assignment.id === deletingId) ?? null;
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [...PROGRAM_ASSIGNMENTS_QUERY_KEY, programId],
    });

  const remove = useMutation({
    mutationFn: (assignment: ProgramAssignment) =>
      deleteProgramAssignment(programId, assignment.id),
    onSuccess: () => {
      setDeletingId(null);
      void refresh();
      showToast({ message: t("deleted"), tone: ToastTone.Success });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("deleteFailed")),
        tone: ToastTone.Error,
      }),
  });

  return {
    deleting,
    teamsWithFiles: deleting ? teamsWithFiles(deleting) : 0,
    start: (assignment: ProgramAssignment) => {
      setDeletingId(assignment.id);
      void refresh();
    },
    cancel: () => {
      if (!remove.isPending) setDeletingId(null);
    },
    confirm: () => {
      if (deleting && !remove.isPending) remove.mutate(deleting);
    },
    removing: remove.isPending,
  };
}

export type ProgramAssignmentDelete = ReturnType<
  typeof useProgramAssignmentDelete
>;
