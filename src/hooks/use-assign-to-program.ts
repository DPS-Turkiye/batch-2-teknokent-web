"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import type {
  AdminProgram,
  ProgramMemberKind,
} from "@/interfaces/admin-overview";
import { assignToProgram } from "@/lib/client/admin-program-members";
import { errorMessage } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

/** The admin puts a mentor or a startup into one of the open programs; it counts at once. */
export function useAssignToProgram(
  kind: ProgramMemberKind,
  targetId: string,
  programs: AdminProgram[],
) {
  const t = useTranslations("adminUsers");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [programId, setProgramId] = useState("");
  const mutation = useMutation({
    mutationFn: (id: string) => assignToProgram(id, kind, targetId),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
      showToast({
        message: t("assignedToProgram", {
          program: programs.find((program) => program.id === id)?.name ?? "",
        }),
        tone: ToastTone.Success,
      });
      setProgramId("");
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("assignToProgramFailed")),
        tone: ToastTone.Error,
      }),
  });

  return {
    programId,
    select: setProgramId,
    canSave: programId !== "" && !mutation.isPending,
    save: () => {
      if (programId && !mutation.isPending) mutation.mutate(programId);
    },
    saving: mutation.isPending,
  };
}
