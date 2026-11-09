"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useToast } from "@/stores/toast-store";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { mentorPoolQueryKey } from "@/hooks/use-mentor-pool";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import {
  ApprovalKind,
  type ProgramApprovals,
} from "@/interfaces/program-approvals";
import {
  decideProgramApproval,
  getProgramApprovals,
} from "@/lib/client/coordinator-programs";
import { errorMessage } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

export const programApprovalsQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "approvals"] as const;

const withoutTeamQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "without-team"] as const;

/** Onaylar: applicants, mentors asking to join, later-created startups and leave/removal requests, decided one by one. */
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
      // The Onaylar tab's count comes with the program; exact, so the list set above is not fetched again.
      void queryClient.invalidateQueries({
        queryKey: coordinatorProgramQueryKey(programId),
        exact: true,
      });
      // An approved person or startup now counts towards the program's teams and people.
      void queryClient.invalidateQueries({
        queryKey: withoutTeamQueryKey(programId),
      });
      void queryClient.invalidateQueries({
        queryKey: programTeamsQueryKey(programId),
      });
      if (input.kind === ApprovalKind.Mentors) {
        void queryClient.invalidateQueries({
          queryKey: mentorPoolQueryKey(programId),
        });
      }
      showToast({
        message: input.accepted ? t("approved") : t("rejected"),
        tone: ToastTone.Success,
      });
    },
    onError: (failure: Error) =>
      showToast({
        message: errorMessage(failure, t("decisionFailed")),
        tone: ToastTone.Error,
      }),
  });

  const run = (kind: ApprovalKind, id: string, accepted: boolean) => {
    if (!decide.isPending) decide.mutate({ kind, id, accepted });
  };

  return {
    query,
    people: query.data?.people ?? [],
    mentors: query.data?.mentors ?? [],
    startups: query.data?.startups ?? [],
    teamChanges: query.data?.teamChanges ?? [],
    deciding: decide.isPending ? decide.variables?.id : null,
    decidePerson: (id: string, accepted: boolean) =>
      run(ApprovalKind.People, id, accepted),
    decideMentor: (id: string, accepted: boolean) =>
      run(ApprovalKind.Mentors, id, accepted),
    decideStartup: (id: string, accepted: boolean) =>
      run(ApprovalKind.Startups, id, accepted),
    decideTeamChange: (id: string, accepted: boolean) =>
      run(ApprovalKind.TeamChanges, id, accepted),
  };
}
