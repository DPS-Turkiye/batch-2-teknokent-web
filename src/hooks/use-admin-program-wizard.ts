"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import {
  COORDINATOR_INVITE_CHECK_QUERY_KEY,
  COORDINATOR_SEARCH_QUERY_KEY,
} from "@/hooks/use-coordinator-picker";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import type { ProgramType } from "@/interfaces/program";
import { ToastTone } from "@/interfaces/toast";
import {
  createProgramInput,
  emptyWizardDraft,
  stepProblem,
  WIZARD_STEPS,
  WizardStep,
  type ProgramWizardDraft,
  type WizardProblem,
} from "@/lib/admin-program-wizard";
import { createCoordinatorProgram } from "@/lib/client/coordinator-programs";
import type { CoordinatorChoice } from "@/lib/coordinator-picker";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

/**
 * The admin's "Yeni Program Oluştur": type, details, coordinators, summary; saved as a draft at the end. Coordinators
 * are picked by email search or invited by email; invited people get their account when the program is saved.
 */
export function useAdminProgramWizard() {
  const t = useTranslations("adminProgramWizard");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [step, setStep] = useState(WizardStep.Type);
  const [draft, setDraft] = useState<ProgramWizardDraft>(emptyWizardDraft);
  const [problem, setProblem] = useState<WizardProblem | null>(null);
  const stepIndex = WIZARD_STEPS.indexOf(step);

  const create = useMutation({
    mutationFn: (type: ProgramType) =>
      createCoordinatorProgram(createProgramInput(draft, type)),
    onSuccess: (detail) => {
      queryClient.setQueryData(
        coordinatorProgramQueryKey(detail.program.id),
        detail,
      );
      void queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_SEARCH_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_INVITE_CHECK_QUERY_KEY,
      });
      showToast({
        message: t("created", { name: detail.program.name }),
        tone: ToastTone.Success,
      });
      router.push(`/admin/programs/${encodeURIComponent(detail.program.id)}`);
    },
  });

  const update = (patch: Partial<ProgramWizardDraft>) => {
    setProblem(null);
    create.reset();
    setDraft((current) => ({ ...current, ...patch }));
  };

  return {
    step,
    stepIndex,
    last: stepIndex === WIZARD_STEPS.length - 1,
    draft,
    update,
    setCoordinators: (coordinators: CoordinatorChoice[]) =>
      update({ coordinators }),
    error: problem
      ? t(`problems.${problem}`)
      : create.error
        ? errorMessage(create.error, t("createFailed"))
        : null,
    next: () => {
      const found = stepProblem(step, draft);
      setProblem(found);
      const next = WIZARD_STEPS[stepIndex + 1];
      if (!found && next) setStep(next);
    },
    back: () => {
      setProblem(null);
      create.reset();
      const previous = WIZARD_STEPS[stepIndex - 1];
      if (stepIndex > 0 && previous) setStep(previous);
    },
    submit: () => {
      if (draft.type && (create.isIdle || create.isError))
        create.mutate(draft.type);
    },
    creating: create.isPending || create.isSuccess,
  };
}
