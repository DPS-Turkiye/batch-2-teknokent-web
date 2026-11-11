"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { OfficeHoursAnswer } from "@/interfaces/academician-office-hours";
import { ToastTone } from "@/interfaces/toast";
import { ACADEMICIAN_OFFICE_HOURS_QUERY_KEY } from "@/lib/academician-office-hours";
import { answerAcademicianRequest } from "@/lib/client/academician-office-hours";
import { useToast } from "@/stores/toast-store";

/**
 * Answers an Office Hours request from any academician screen. Not optimistic: a real source can still refuse an
 * accept (the student withdrew, the slot was taken), so the screens wait for its answer and then reload.
 */
export function useRequestAnswer() {
  const t = useTranslations("iaAcademician.answer");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: OfficeHoursAnswer }) =>
      answerAcademicianRequest(id, answer),
    onSuccess: (_, { answer }) => {
      showToast({
        message: t(`done.${answer.action}`),
        tone: ToastTone.Success,
      });
    },
    onError: () => {
      showToast({ message: t("failed"), tone: ToastTone.Error });
    },
    // After a failure too: the request has usually changed meanwhile, so the current list is what to show.
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
      }),
  });

  return {
    /** `onDone` runs after the source accepted the answer, e.g. to close the drawer it came from. */
    answer: (id: string, answer: OfficeHoursAnswer, onDone?: () => void) => {
      mutation.mutate({ id, answer }, { onSuccess: () => onDone?.() });
    },
    /** The request being answered, so only its buttons wait. */
    answeringId: mutation.isPending ? mutation.variables.id : null,
  };
}

export type RequestAnswer = ReturnType<typeof useRequestAnswer>;
