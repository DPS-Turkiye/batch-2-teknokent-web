"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { ToastTone } from "@/interfaces/toast";
import { requestPasswordReset } from "@/lib/firebase/auth";
import { useToast } from "@/stores/toast-store";

/** Sends the signed-in person a Firebase password-reset e-mail and says how it went. */
export function usePasswordReset() {
  const session = useAppSession();
  const t = useTranslations("accountDialogs");
  const { showToast } = useToast();
  const [isSendingReset, setIsSendingReset] = useState(false);

  const sendPasswordReset = async () => {
    if (!session?.email) return;
    setIsSendingReset(true);
    try {
      await requestPasswordReset(session.email);
      showToast({
        message: t("resetSent"),
        tone: ToastTone.Success,
      });
    } catch {
      showToast({
        message: t("resetFailed"),
        tone: ToastTone.Error,
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return { isSendingReset, sendPasswordReset };
}
