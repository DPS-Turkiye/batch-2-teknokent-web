"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/stores/toast-store";
import { useOrganizationPrograms } from "@/hooks/use-programs";
import { useAdoptStartupSession } from "@/hooks/use-startup-membership";
import type { OrganizationMember } from "@/interfaces/organization-member";
import type { TeamChange } from "@/interfaces/team-change";
import {
  cancelTeamChange,
  getTeamChanges,
  leaveTeam,
  requestLeave,
} from "@/lib/client/team-changes";
import { errorMessage } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

export const TEAM_CHANGES_QUERY_KEY = ["team-changes"] as const;

/** True when the startup is in a program, so leaving and removing wait for its coordinator. */
export function useStartupInProgram() {
  const { data } = useOrganizationPrograms();
  return (data?.programs.length ?? 0) > 0;
}

/**
 * The Ekip tab's leave side: a member asks the coordinator, the leader leaves
 * at once after naming a successor (or archives a startup nobody else is in).
 */
export function useTeamChanges(members: OrganizationMember[]) {
  const t = useTranslations("startupTeam.changes");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const session = useAppSession();
  const adopt = useAdoptStartupSession();
  const inProgram = useStartupInProgram();
  const query = useQuery({
    queryKey: TEAM_CHANGES_QUERY_KEY,
    queryFn: getTeamChanges,
  });
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [successorId, setSuccessorId] = useState("");

  const pending = query.data ?? [];
  const me = session?.userId;
  const viewerIsLeader = members.some(
    (member) => member.founder && member.id === me,
  );
  const changeFor = (memberId: string): TeamChange | null =>
    pending.find((change) => change.memberId === memberId) ?? null;
  // Someone already on the way out cannot take the lead.
  const successors = members.filter(
    (member) => member.id !== me && !changeFor(member.id),
  );
  const alone = members.every((member) => member.id === me);
  const myChange = me ? changeFor(me) : null;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: TEAM_CHANGES_QUERY_KEY });
  const fail = (fallback: string) => (error: Error) =>
    showToast({
      message: errorMessage(error, fallback),
      tone: ToastTone.Error,
    });

  const askLeave = useMutation({
    mutationFn: requestLeave,
    onSuccess: () => {
      setConfirmingLeave(false);
      void refresh();
      showToast({ message: t("leaveRequested"), tone: ToastTone.Success });
    },
    onError: fail(t("leaveRequestFailed")),
  });

  const cancel = useMutation({
    mutationFn: cancelTeamChange,
    onSuccess: () => {
      void refresh();
      showToast({ message: t("cancelled"), tone: ToastTone.Success });
    },
    onError: fail(t("cancelFailed")),
  });

  const leave = useMutation({
    mutationFn: () => leaveTeam(alone ? null : successorId),
    onSuccess: (nextSession) => {
      setConfirmingLeave(false);
      adopt(nextSession);
      showToast({ message: t("left"), tone: ToastTone.Success });
      router.replace("/startup");
    },
    onError: fail(t("leaveFailed")),
  });

  return {
    alone,
    // Outside a program there is no coordinator to ask, so only the leader can leave.
    canLeave: !myChange && (viewerIsLeader || inProgram),
    cancel: (requestId: string) => cancel.mutate(requestId),
    cancellingId: cancel.isPending ? cancel.variables : null,
    changeFor,
    closeLeave: () => setConfirmingLeave(false),
    confirmLeave: () => {
      if (!viewerIsLeader) askLeave.mutate();
      else if (alone || successorId) leave.mutate();
    },
    confirmingLeave,
    inProgram,
    isLeaving: askLeave.isPending || leave.isPending,
    myChange,
    openLeave: () => {
      setSuccessorId("");
      setConfirmingLeave(true);
    },
    refresh,
    requestedByMe: (change: TeamChange) => change.requestedById === me,
    setSuccessorId,
    successorId,
    successors,
    viewerIsLeader,
  };
}
