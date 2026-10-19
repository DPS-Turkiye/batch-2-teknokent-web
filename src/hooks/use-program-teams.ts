"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import type {
  ProgramTeam,
  TeamInviteInput,
} from "@/interfaces/coordinator-program";
import {
  addProgramTeams,
  getProgramTeams,
  removeProgramTeam,
  sendProgramTeamCode,
  updateProgramTeam,
} from "@/lib/client/coordinator-programs";
import {
  emptyTeamRow,
  filterTeams,
  TeamFilter,
  teamFilterOptions,
  type TeamRowDraft,
  teamRowProblems,
} from "@/lib/program-launch";
import { errorMessage } from "@/lib/utils";

export const programTeamsQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "teams"] as const;

export function useProgramTeamsQuery(programId: string) {
  return useQuery({
    queryKey: programTeamsQueryKey(programId),
    queryFn: () => getProgramTeams(programId),
  });
}

function teamInput(row: TeamRowDraft): TeamInviteInput {
  return { teamName: row.teamName.trim(), leadEmail: row.leadEmail.trim() };
}

/** Takımlar: follow which leads joined, copy or email codes, fix or remove teams still waiting, open a team. */
export function useProgramTeams(programId: string) {
  const t = useTranslations("programTeams");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useProgramTeamsQuery(programId);
  const [filter, setFilter] = useState(TeamFilter.All);
  const [adding, setAdding] = useState<TeamRowDraft | null>(null);
  const [editing, setEditing] = useState<TeamRowDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const saved = (teams: ProgramTeam[]) => {
    queryClient.setQueryData(programTeamsQueryKey(programId), teams);
    void queryClient.invalidateQueries({
      queryKey: coordinatorProgramQueryKey(programId),
      exact: true,
    });
  };
  const onError = (failure: Error) =>
    setError(errorMessage(failure, t("saveFailed")));

  const add = useMutation({
    mutationFn: (row: TeamRowDraft) =>
      addProgramTeams(programId, [teamInput(row)]),
    onSuccess: (teams) => {
      saved(teams);
      setAdding(null);
      showToast({ message: t("added"), tone: "success" });
    },
    onError,
  });
  const update = useMutation({
    mutationFn: (row: TeamRowDraft) =>
      updateProgramTeam(programId, row.key, teamInput(row)),
    onSuccess: (teams) => {
      saved(teams);
      setEditing(null);
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (inviteId: string) => removeProgramTeam(programId, inviteId),
    onSuccess: saved,
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, t("removeFailed")),
        tone: "error",
      }),
  });

  const sendCode = useMutation({
    mutationFn: (team: ProgramTeam) =>
      sendProgramTeamCode(programId, team.inviteId as string),
    onSuccess: (teams, team) => {
      saved(teams);
      const row = teams.find((item) => item.inviteId === team.inviteId);
      showToast(
        row?.codeSendFailed
          ? {
              message: t("sendFailedTo", { email: team.leadEmail ?? "" }),
              tone: "error",
            }
          : {
              message: t("sentTo", { email: team.leadEmail ?? "" }),
              tone: "success",
            },
      );
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, t("sendFailed")),
        tone: "error",
      }),
  });

  const validate = (row: TeamRowDraft) => {
    const problem = teamRowProblems([row]).get(row.key);
    setError(
      problem
        ? row.teamName.trim()
          ? t("invalidEmail")
          : t("nameRequired")
        : null,
    );
    return !problem && Boolean(row.teamName.trim());
  };

  const teams = query.data ?? [];
  return {
    query,
    teams,
    visible: filterTeams(teams, filter),
    filter,
    setFilter,
    filterOptions: teamFilterOptions(teams, t),
    adding,
    startAdding: () => {
      setError(null);
      setEditing(null);
      setAdding(emptyTeamRow());
    },
    changeAdding: (patch: Partial<TeamRowDraft>) =>
      setAdding((row) => (row ? { ...row, ...patch } : row)),
    saveAdding: () => adding && validate(adding) && add.mutate(adding),
    editing,
    startEditing: (team: ProgramTeam) => {
      if (!team.inviteId) return;
      setError(null);
      setAdding(null);
      setEditing({
        key: team.inviteId,
        teamName: team.name,
        leadEmail: team.leadEmail ?? "",
      });
    },
    changeEditing: (patch: Partial<TeamRowDraft>) =>
      setEditing((row) => (row ? { ...row, ...patch } : row)),
    saveEditing: () => editing && validate(editing) && update.mutate(editing),
    cancel: () => {
      setError(null);
      setAdding(null);
      setEditing(null);
    },
    remove: (inviteId: string) => remove.mutate(inviteId),
    copyCode: async (code: string) => {
      await navigator.clipboard.writeText(code);
      showToast({ message: t("copied", { code }), tone: "success" });
    },
    sendCode: (team: ProgramTeam) => team.inviteId && sendCode.mutate(team),
    sendingCodeFor: sendCode.isPending
      ? (sendCode.variables?.inviteId ?? null)
      : null,
    detailId,
    openDetail: (organizationId: string) => setDetailId(organizationId),
    closeDetail: () => setDetailId(null),
    error,
    busy:
      add.isPending ||
      update.isPending ||
      remove.isPending ||
      sendCode.isPending,
  };
}
