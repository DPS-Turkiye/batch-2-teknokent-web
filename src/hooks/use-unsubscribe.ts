"use client";

import { useMutation } from "@tanstack/react-query";

import { unsubscribeFromEmails } from "@/lib/client/email-center";

/** Nothing happens until the button is pressed: mail scanners open links on their own. */
export function useUnsubscribe(token: string | null) {
  const unsubscribe = useMutation({ mutationFn: unsubscribeFromEmails });
  return {
    isMissingToken: token === null,
    isDone: unsubscribe.isSuccess,
    canConfirm: token !== null && !unsubscribe.isSuccess,
    isPending: unsubscribe.isPending,
    hasFailed: unsubscribe.isError,
    confirm: () => {
      if (token !== null) unsubscribe.mutate(token);
    },
  };
}
