"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import type { AdminProgram, AdminStartup } from "@/interfaces/admin-overview";
import { ToastTone } from "@/interfaces/toast";
import { moveStartupToProgram } from "@/lib/client/admin-program-members";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export type MovableTeam = Pick<
  AdminStartup,
  "id" | "name" | "programId" | "programName"
>;

export type TeamProgramMove = ReturnType<typeof useMoveTeamProgram>;

/**
 * The admin moves a team out of the program it is listed under into another open one, after confirming.
 * `onMoved` runs on success, so the screen can leave a row that no longer exists under the old program.
 */
export function useMoveTeamProgram(
  team: MovableTeam,
  targets: AdminProgram[],
  onMoved: () => void,
) {
  const t = useTranslations("adminUsers.moveProgram");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [targetId, setTargetId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const target = targets.find((program) => program.id === targetId) ?? null;
  const move = useMutation({
    mutationFn: (toProgramId: string) =>
      moveStartupToProgram(toProgramId, team.id, team.programId),
  });

  function confirm() {
    if (!target || move.isPending) return;
    // Per-call callbacks, unlike a promise, do not fire once the admin has left this screen.
    move.mutate(target.id, {
      onSuccess: (result) => {
        setConfirming(false);
        const moved = { team: team.name, program: result.toProgramName };
        showToast({
          message:
            result.withdrawnRequests > 0
              ? t("movedClosingRequests", {
                  ...moved,
                  count: result.withdrawnRequests,
                })
              : t("moved", moved),
          tone: ToastTone.Success,
        });
        void queryClient.invalidateQueries({
          queryKey: ADMIN_OVERVIEW_QUERY_KEY,
        });
        onMoved();
      },
      onError: (error) => {
        setConfirming(false);
        showToast({
          message: errorMessage(error, t("failed")),
          tone: ToastTone.Error,
        });
      },
    });
  }

  return {
    targetId,
    select: setTargetId,
    canAsk: target !== null && !move.isPending,
    ask: () => {
      if (target) setConfirming(true);
    },
    /** The program waiting for the admin's "yes"; null while nothing is being confirmed. */
    confirmation: confirming ? target : null,
    cancel: () => {
      // Escape or a backdrop click must not hide a move that is already on its way.
      if (!move.isPending) setConfirming(false);
    },
    confirm,
    pending: move.isPending,
  };
}
