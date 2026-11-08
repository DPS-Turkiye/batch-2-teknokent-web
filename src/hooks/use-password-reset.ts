"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/stores/toast-store";
import { requestPasswordReset } from "@/lib/firebase/auth";

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
        tone: "success",
      });
    } catch {
      showToast({
        message: t("resetFailed"),
        tone: "error",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return { isSendingReset, sendPasswordReset };
}
