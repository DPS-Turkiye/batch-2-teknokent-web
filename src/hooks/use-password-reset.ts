"use client";

import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import { requestPasswordReset } from "@/lib/firebase/auth";

/** Sends the signed-in person a Firebase password-reset e-mail and says how it went. */
export function usePasswordReset() {
  const session = useAppSession();
  const { showToast } = useToast();
  const [isSendingReset, setIsSendingReset] = useState(false);

  const sendPasswordReset = async () => {
    if (!session?.email) return;
    setIsSendingReset(true);
    try {
      await requestPasswordReset(session.email);
      showToast({
        message: "Şifre sıfırlama bağlantısı e-postana gönderildi.",
        tone: "success",
      });
    } catch {
      showToast({
        message: "Şifre sıfırlama e-postası gönderilemedi.",
        tone: "error",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return { isSendingReset, sendPasswordReset };
}
