"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import { revokeUserSignIns } from "@/lib/client/admin-users";
import { errorMessage } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

/** Ends every sign-in of one user after the admin confirms it. */
export function useRevokeSignIns(user: { id: string; fullName: string }) {
  const t = useTranslations("adminUsers.revokeSignIns");
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  // Once the question has been asked, focus goes back to the button when it closes.
  const [asked, setAsked] = useState(false);
  const revoke = useMutation({
    mutationFn: () => revokeUserSignIns(user.id),
  });

  function close() {
    setConfirming(false);
    setAsked(true);
  }

  function confirm() {
    void revoke
      .mutateAsync()
      .then(() => {
        close();
        showToast({
          message: t("done", { name: user.fullName }),
          tone: ToastTone.Success,
        });
      })
      .catch((error: unknown) =>
        showToast({
          message: errorMessage(error, t("failed")),
          tone: ToastTone.Error,
        }),
      );
  }

  return {
    confirming,
    returnFocus: asked,
    pending: revoke.isPending,
    ask: () => setConfirming(true),
    cancel: close,
    confirm,
  };
}
