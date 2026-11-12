"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import {
  COORDINATOR_INVITE_CHECK_QUERY_KEY,
  COORDINATOR_SEARCH_QUERY_KEY,
} from "@/hooks/use-coordinator-picker";
import { ToastTone } from "@/interfaces/toast";
import {
  addProgramCoordinator,
  inviteProgramCoordinator,
} from "@/lib/client/coordinator-programs";
import {
  CoordinatorChoiceKind,
  type CoordinatorChoice,
} from "@/lib/coordinator-picker";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

/**
 * Adds the person picked in an existing program's coordinator field straight away: an approved coordinator by id,
 * or an invited email (the backend opens the account and mails the password link).
 */
export function useAddProgramCoordinator(
  programId: string,
  onAdded: () => void,
) {
  const t = useTranslations("coordinatorPicker");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: (choice: CoordinatorChoice) =>
      choice.kind === CoordinatorChoiceKind.Existing
        ? addProgramCoordinator(programId, choice.id)
        : inviteProgramCoordinator(programId, {
            fullName: choice.fullName,
            email: choice.email,
          }),
    onSuccess: (_coordinators, choice) => {
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_SEARCH_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_INVITE_CHECK_QUERY_KEY,
      });
      showToast({
        message:
          choice.kind === CoordinatorChoiceKind.Invited
            ? t("invited", { name: choice.fullName, email: choice.email })
            : t("added", { name: choice.fullName }),
        tone: ToastTone.Success,
      });
      onAdded();
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("addFailed")),
        tone: ToastTone.Error,
      }),
  });

  return {
    /** The picker's change handler: the newest choice is added to the program. */
    pick: (next: CoordinatorChoice[]) => {
      const choice = next.at(-1);
      if (choice && !mutation.isPending) mutation.mutate(choice);
    },
    adding: mutation.isPending,
  };
}
