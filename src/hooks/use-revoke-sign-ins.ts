"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { revokeUserSignIns } from "@/lib/client/admin-users";
import { errorMessage } from "@/lib/utils";

/** Ends every sign-in of one user after the admin confirms it. */
export function useRevokeSignIns(user: { id: string; fullName: string }) {
  const t = useTranslations("adminUsers.revokeSignIns");
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const revoke = useMutation({
    mutationFn: () => revokeUserSignIns(user.id),
  });

  function confirm() {
    void revoke
      .mutateAsync()
      .then(() => {
        setConfirming(false);
        showToast({
          message: t("done", { name: user.fullName }),
          tone: "success",
        });
      })
      .catch((error: unknown) =>
        showToast({ message: errorMessage(error, t("failed")), tone: "error" }),
      );
  }

  return {
    confirming,
    pending: revoke.isPending,
    ask: () => setConfirming(true),
    cancel: () => setConfirming(false),
    confirm,
  };
}
