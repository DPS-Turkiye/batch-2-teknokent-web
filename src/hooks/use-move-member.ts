"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { personSummaryQueryKey } from "@/hooks/use-person-summary";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import { teamHistoryQueryKey } from "@/hooks/use-team-history";
import type { TeamMoveTeam } from "@/interfaces/team-move";
import { ToastTone } from "@/interfaces/toast";
import { getPersonSummary } from "@/lib/client/person-summary";
import { getTeamMoveOptions, moveMemberToTeam } from "@/lib/client/team-moves";
import { editionOf } from "@/lib/edition";
import { offersTeamMove } from "@/lib/edition-screens";
import {
  canOfferTeamMove,
  filterTeamMoveTargets,
  TEAM_MOVE_BLOCK_KEYS,
  teamMoveLabel,
} from "@/lib/team-move";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const teamMoveQueryKey = (userId: string) =>
  ["team-move", userId] as const;

export type MemberMove = ReturnType<typeof useMoveMember>;

/**
 * Moving one person to another team from an admin or coordinator screen. The dialog loads what the backend allows
 * for this caller only once it opens. `programId` is the coordinator program whose team lists must refresh.
 */
export function useMoveMember(userId: string, programId?: string) {
  const t = useTranslations("teamMove");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [targetId, setTargetId] = useState("");

  const options = useQuery({
    queryKey: teamMoveQueryKey(userId),
    queryFn: () => getTeamMoveOptions(userId),
    enabled: open,
  });
  const data = options.data;
  const targets = filterTeamMoveTargets(data?.targets ?? [], search);
  // Only a team still on screen can be moved to: a search that hides the choice also unpicks it.
  const target: TeamMoveTeam | null =
    targets.find((team) => team.organizationId === targetId) ?? null;

  // The options are dropped on close, so a reopened dialog never shows (or acts on) what another admin has changed since.
  const reset = () => {
    setOpen(false);
    setSearch("");
    setTargetId("");
    queryClient.removeQueries({ queryKey: teamMoveQueryKey(userId) });
  };

  const move = useMutation({
    mutationFn: (organizationId: string) =>
      moveMemberToTeam(userId, organizationId),
    // On the mutation, not the call: the move happened even if the dialog was closed before the answer came.
    onSuccess: (result) => {
      showToast({
        message: t("moved", {
          name: data?.fullName ?? "",
          team: result.to.name,
        }),
        tone: ToastTone.Success,
      });
      reset();
      const keys = [
        teamHistoryQueryKey(userId),
        personSummaryQueryKey(userId),
        ADMIN_OVERVIEW_QUERY_KEY,
        ...[programId, result.to.programId]
          .filter((id): id is string => Boolean(id))
          .map(programTeamsQueryKey),
      ];
      keys.forEach(
        (queryKey) => void queryClient.invalidateQueries({ queryKey }),
      );
    },
    onError: (error) => {
      showToast({
        message: errorMessage(error, t("failed")),
        tone: ToastTone.Error,
      });
    },
  });

  return {
    open,
    show: () => setOpen(true),
    close: () => {
      // Escape or a backdrop click must not hide a move that is already on its way.
      if (!move.isPending) reset();
    },
    loading: options.isLoading,
    loadError: options.error
      ? errorMessage(options.error, t("loadFailed"))
      : null,
    fullName: data?.fullName ?? "",
    currentTeamLabel: data?.currentTeam
      ? teamMoveLabel(data.currentTeam)
      : null,
    blockedKey: data?.blockedBy ? TEAM_MOVE_BLOCK_KEYS[data.blockedBy] : null,
    hasTargets: (data?.targets.length ?? 0) > 0,
    search,
    setSearch,
    targets,
    targetId,
    select: setTargetId,
    target,
    canMove: target !== null && !move.isPending,
    confirm: () => {
      if (target && !move.isPending) move.mutate(target.organizationId);
    },
    pending: move.isPending,
  };
}

/** Whether this edition moves people between teams at all; the backend closes the endpoint elsewhere. */
export function useTeamMoveAvailable() {
  return offersTeamMove(editionOf(useAppSession()));
}

/** The admin profile's "Takıma taşı" section shows for an approved startup member only. */
export function useOffersTeamMove(userId: string) {
  // Shares the profile page's query, so the account is read once.
  const { data: person } = useQuery({
    queryKey: personSummaryQueryKey(userId),
    queryFn: () => getPersonSummary(userId),
  });
  return person !== undefined && canOfferTeamMove(person);
}
