"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { COORDINATOR_PROGRAMS_QUERY_KEY } from "@/hooks/use-coordinator-programs";
import { createCoordinatorProgram } from "@/lib/client/coordinator-programs";
import { RULE_LIMITS, stepDays } from "@/lib/coordinator-program-detail";
import {
  basicsError,
  createProgramInput,
  emptyLaunchDraft,
  emptyTeamRow,
  filledTeamRows,
  LAUNCH_STEPS,
  type LaunchDraft,
  type LaunchRules,
  LaunchStep,
  MAX_LAUNCH_TEAMS,
  parseTeamsCsv,
  type TeamRowDraft,
  teamRowProblems,
} from "@/lib/program-launch";
import { errorMessage } from "@/lib/utils";

/** The three-step "Yeni program" wizard; the program and its team codes are created in one request at the end. */
export function useProgramLaunch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const session = useAppSession();
  const [step, setStep] = useState(LaunchStep.Basics);
  const [draft, setDraft] = useState<LaunchDraft>(emptyLaunchDraft);
  const [error, setError] = useState<string | null>(null);

  const problems = teamRowProblems(draft.teams);
  const stepIndex = LAUNCH_STEPS.findIndex((item) => item.id === step);

  const create = useMutation({
    mutationFn: () => createCoordinatorProgram(createProgramInput(draft)),
    onSuccess: (detail) => {
      queryClient.setQueryData(
        coordinatorProgramQueryKey(detail.program.id),
        detail,
      );
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_PROGRAMS_QUERY_KEY,
      });
      const teams = filledTeamRows(draft.teams).length;
      showToast({
        message:
          teams > 0
            ? `${detail.program.name} oluşturuldu. ${teams} takımın kodu Takımlar sekmesinde hazır.`
            : `${detail.program.name} oluşturuldu.`,
        tone: "success",
      });
      router.push(
        `/coordinator/programs/${encodeURIComponent(detail.program.id)}`,
      );
    },
    onError: (failure) =>
      setError(errorMessage(failure, "Program oluşturulamadı.")),
  });

  const update = (patch: Partial<LaunchDraft>) => {
    setError(null);
    setDraft((current) => ({ ...current, ...patch }));
  };
  const setTeams = (teams: TeamRowDraft[]) =>
    update({ teams: teams.slice(0, MAX_LAUNCH_TEAMS) });

  return {
    ownerName: session?.fullName ?? "Siz",
    step,
    stepIndex,
    draft,
    update,
    stepRule: (rule: keyof LaunchRules, delta: number) =>
      update({
        rules: {
          ...draft.rules,
          [rule]: stepDays(draft.rules[rule], delta, RULE_LIMITS[rule]),
        },
      }),
    updateTeam: (key: string, patch: Partial<TeamRowDraft>) =>
      setTeams(
        draft.teams.map((row) =>
          row.key === key ? { ...row, ...patch } : row,
        ),
      ),
    addTeam: () => setTeams([...draft.teams, emptyTeamRow()]),
    removeTeam: (key: string) => {
      const rest = draft.teams.filter((row) => row.key !== key);
      setTeams(rest.length > 0 ? rest : [emptyTeamRow()]);
    },
    importCsv: async (file: File) => {
      const rows = parseTeamsCsv(await file.text());
      if (rows.length === 0) {
        setError("Dosyada “takım adı, e-posta” satırı bulunamadı.");
        return;
      }
      setTeams([...filledTeamRows(draft.teams), ...rows]);
    },
    problems,
    teamCount: filledTeamRows(draft.teams).length,
    error,
    creating: create.isPending,
    back: () => {
      setError(null);
      if (stepIndex > 0) setStep(LAUNCH_STEPS[stepIndex - 1].id);
    },
    next: () => {
      const problem = step === LaunchStep.Basics ? basicsError(draft) : null;
      setError(problem);
      if (!problem && stepIndex < LAUNCH_STEPS.length - 1) {
        setStep(LAUNCH_STEPS[stepIndex + 1].id);
      }
    },
    submit: () => {
      const problem =
        basicsError(draft) ??
        (problems.size > 0 ? `${problems.size} satırda hata var.` : null);
      setError(problem);
      if (!problem) create.mutate();
    },
  };
}
