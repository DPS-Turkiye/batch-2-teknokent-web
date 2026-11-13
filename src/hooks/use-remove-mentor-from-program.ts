"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import type { AdminProgram, AdminUser } from "@/interfaces/admin-overview";
import { ToastTone } from "@/interfaces/toast";
import { removeMentorFromProgram } from "@/lib/client/admin-program-members";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export type RemovableMentor = Pick<AdminUser, "id" | "fullName">;
export type MentorProgram = Pick<AdminProgram, "id" | "name">;

export type MentorProgramRemoval = ReturnType<
  typeof useRemoveMentorFromProgram
>;

/** The admin takes an accepted mentor out of one program's pool, after confirming. */
export function useRemoveMentorFromProgram(
  mentor: RemovableMentor,
  program: MentorProgram,
) {
  const t = useTranslations("adminUsers.removeFromProgram");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const removal = useMutation({
    mutationFn: () => removeMentorFromProgram(program.id, mentor.id),
    // On the mutation, not on the call: the removal has happened on the server even when the row or the
    // drawer was gone before the answer came, so the lists must still refresh and say so.
    onSuccess: (result) => {
      const removed = { mentor: mentor.fullName, program: result.programName };
      showToast({
        message:
          result.withdrawnRequests > 0
            ? t("removedClosingRequests", {
                ...removed,
                count: result.withdrawnRequests,
              })
            : t("removed", removed),
        tone: ToastTone.Success,
      });
    },
    onError: (error) => {
      showToast({
        message: errorMessage(error, t("failed")),
        tone: ToastTone.Error,
      });
    },
    onSettled: () => {
      setConfirming(false);
      // After a refusal too: it usually means the list on screen is out of date.
      void queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
    },
  });

  return {
    /** True while the confirmation dialog is open. */
    confirming,
    ask: () => {
      if (!removal.isPending) setConfirming(true);
    },
    cancel: () => {
      // Escape or a backdrop click must not hide a removal that is already on its way.
      if (!removal.isPending) setConfirming(false);
    },
    confirm: () => {
      if (confirming && !removal.isPending) removal.mutate();
    },
    pending: removal.isPending,
  };
}
