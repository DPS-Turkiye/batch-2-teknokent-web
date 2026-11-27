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

/** Program › Ödevler › "Sil": the Ödev, every team's copy and their uploaded files, after a confirm. */
export function useProgramAssignmentDelete(programId: string) {
  const t = useTranslations("programAssignments");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState<ProgramAssignment | null>(null);

  const remove = useMutation({
    mutationFn: (assignment: ProgramAssignment) =>
      deleteProgramAssignment(programId, assignment.id),
    onSuccess: () => {
      setDeleting(null);
      void queryClient.invalidateQueries({
        queryKey: [...PROGRAM_ASSIGNMENTS_QUERY_KEY, programId],
      });
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
    start: (assignment: ProgramAssignment) => setDeleting(assignment),
    cancel: () => {
      if (!remove.isPending) setDeleting(null);
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
