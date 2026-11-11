"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { usePushDevice } from "@/hooks/use-push-device";
import { MOBILE_HOME, MOBILE_LOGIN } from "@/lib/mobile";
import {
  accountAvatarClass,
  accountChip,
  webEditLinkFor,
} from "@/lib/mobile-account";
import { unregisterPushDevice } from "@/lib/push-device";
import { initials } from "@/lib/utils";

export function useMobileAccount() {
  const router = useRouter();
  const { session, logout } = useSession();
  const push = usePushDevice();
  const t = useTranslations("mobile");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const role = session?.role;

  const notifications = useNotificationPreferences();

  const signOut = async () => {
    setIsSigningOut(true);
    await unregisterPushDevice().catch(() => undefined);
    await logout();
    router.replace(MOBILE_LOGIN);
  };

  return {
    avatarClass: accountAvatarClass(role),
    backHref: MOBILE_HOME,
    chip: session ? accountChip(session, t) : "",
    email: session?.email ?? "",
    fullName: session?.fullName ?? "",
    initials: initials(session?.fullName ?? ""),
    isSigningOut,
    ...notifications,
    push,
    signOut,
    webEdit: webEditLinkFor(role, t),
  };
}
