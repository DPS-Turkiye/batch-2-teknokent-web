"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useSession } from "@/components/providers/session-provider";

/** "Kaydet ve çık" / "Çıkış yap": keep the draft if there is one, then sign out. */
export function useOnboardingExit(saveDraft?: () => Promise<unknown>) {
  const { logout } = useSession();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const exit = useCallback(async () => {
    setExiting(true);
    try {
      if (saveDraft) await saveDraft().catch(() => undefined);
      await logout().catch(() => undefined);
    } finally {
      router.push("/");
    }
  }, [logout, router, saveDraft]);

  return { exit, exiting };
}
