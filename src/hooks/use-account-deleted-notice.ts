"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { ToastTone } from "@/interfaces/toast";
import { saysAccountDeleted } from "@/lib/self-deletion";
import { useToast } from "@/stores/toast-store";

/**
 * The landing page after someone deleted their own account: the deletion ends on a full page load (so nothing of
 * the old session survives in memory), which a toast cannot outlive, so the address carries the news instead.
 */
export function useAccountDeletedNotice() {
  const t = useTranslations("dangerZone.account");
  const { showToast } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || !saysAccountDeleted(window.location.search)) return;
    shown.current = true;
    showToast({ message: t("done"), tone: ToastTone.Success });
    // Drop the parameter without a navigation, so a reload or a shared link does not say it again.
    window.history.replaceState(null, "", window.location.pathname);
  }, [showToast, t]);
}
