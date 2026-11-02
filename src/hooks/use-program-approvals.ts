"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useToast } from "@/components/providers/toast-provider";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import {
  ApprovalKind,
  type ProgramApprovals,
} from "@/interfaces/program-approvals";
import {
  decideProgramApproval,
  getProgramApprovals,
  getProgramWithoutTeam,
} from "@/lib/client/coordinator-programs";
import { errorMessage } from "@/lib/utils";

export const programApprovalsQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "approvals"] as const;

const withoutTeamQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "without-team"] as const;

/** Onaylar: the program's applicants and later-created startups, approved or rejected one by one. */
export function useProgramApprovals(programId: string) {
  const t = useTranslations("programApprovals");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: programApprovalsQueryKey(programId),
    queryFn: () => getProgramApprovals(programId),
  });

  const decide = useMutation({
    mutationFn: (input: {
      kind: ApprovalKind;
      id: string;
      accepted: boolean;
    }) =>
      decideProgramApproval(programId, input.kind, input.id, input.accepted),
    onSuccess: (approvals: ProgramApprovals, input) => {
      queryClient.setQueryData(programApprovalsQueryKey(programId), approvals);
      // An approved person or startup now counts towards the program's teams and people.
      void queryClient.invalidateQueries({
        queryKey: withoutTeamQueryKey(programId),
      });
      void queryClient.invalidateQueries({
        queryKey: programTeamsQueryKey(programId),
      });
      showToast({
        message: input.accepted ? t("approved") : t("rejected"),
        tone: "success",
      });
    },
    onError: (failure: Error) =>
      showToast({
        message: errorMessage(failure, t("decisionFailed")),
        tone: "error",
      }),
  });

  const run = (kind: ApprovalKind, id: string, accepted: boolean) => {
    if (!decide.isPending) decide.mutate({ kind, id, accepted });
  };

  return {
    query,
    people: query.data?.people ?? [],
    startups: query.data?.startups ?? [],
    deciding: decide.isPending ? decide.variables?.id : null,
    decidePerson: (id: string, accepted: boolean) =>
      run(ApprovalKind.People, id, accepted),
    decideStartup: (id: string, accepted: boolean) =>
      run(ApprovalKind.Startups, id, accepted),
  };
}

/** Takımı olmayanlar: approved people of the program who have no startup yet. */
export function useProgramWithoutTeam(programId: string) {
  return useQuery({
    queryKey: withoutTeamQueryKey(programId),
    queryFn: () => getProgramWithoutTeam(programId),
  });
}
