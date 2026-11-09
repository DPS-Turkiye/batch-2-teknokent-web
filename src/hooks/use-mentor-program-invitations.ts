"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/stores/toast-store";
import {
  useDecideProgramInvitation,
  useProgramInvitations,
  usePrograms,
} from "@/hooks/use-programs";
import type { ProgramInvitation } from "@/interfaces/program";
import { programsAwaitingReview } from "@/lib/program-invitations";
import { errorMessage } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

/** A mentor's program invitations from coordinators, answered from the dashboard, and their own pending joins. */
export function useMentorProgramInvitations() {
  const t = useTranslations("mentorProgramInvitations");
  const { showToast } = useToast();
  const session = useAppSession();
  const invitations = useProgramInvitations();
  const programs = usePrograms();
  const decide = useDecideProgramInvitation();

  const awaitingReview = useMemo(
    () => programsAwaitingReview(programs.data ?? [], session?.userId),
    [programs.data, session?.userId],
  );

  const answer = (invitation: ProgramInvitation, accepted: boolean) => {
    if (decide.isPending) return;
    decide.mutate(
      { programId: invitation.programId, accepted },
      {
        onSuccess: () =>
          showToast({
            message: accepted
              ? t("accepted", { name: invitation.programName })
              : t("declined", { name: invitation.programName }),
            tone: ToastTone.Success,
          }),
        onError: (failure: Error) =>
          showToast({
            message: errorMessage(failure, t("answerFailed")),
            tone: ToastTone.Error,
          }),
      },
    );
  };

  return {
    invitations: invitations.data ?? [],
    awaitingReview,
    isLoading: invitations.isLoading,
    error: invitations.error,
    answeringId: decide.isPending
      ? (decide.variables?.programId ?? null)
      : null,
    accept: (invitation: ProgramInvitation) => answer(invitation, true),
    decline: (invitation: ProgramInvitation) => answer(invitation, false),
  };
}
