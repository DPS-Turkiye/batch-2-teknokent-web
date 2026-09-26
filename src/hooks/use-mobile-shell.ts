"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useMobileConversations } from "@/hooks/use-mobile-messages";
import { usePushSync } from "@/hooks/use-push-device";
import { MobileTab } from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import {
  hasMobileApp,
  MOBILE_HOME,
  mobileAccentFor,
  mobileTabForPath,
  mobileTabsFor,
  webHref,
} from "@/lib/mobile";

const EVERY_ROLE_TAB = [
  ...mobileTabsFor(UserRole.Mentee),
  ...mobileTabsFor(UserRole.Mentor),
];

/** Where a signed-in visitor on this path should be sent instead, if anywhere. */
function misplacedTarget(pathname: string, role: UserRole) {
  if (!hasMobileApp(role)) return webHref("/workspace");
  const belongsToSomeTab = mobileTabForPath(pathname, EVERY_ROLE_TAB);
  const ownTab = mobileTabForPath(pathname, mobileTabsFor(role));
  // A mentee opening the mentor's Startuplar tab (or the reverse) goes home.
  return belongsToSomeTab && !ownTab ? MOBILE_HOME : null;
}

export function useMobileShell() {
  const { session, isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = session?.role;

  const tabs = useMemo(() => mobileTabsFor(role), [role]);
  const activeTab = mobileTabForPath(pathname, tabs)?.tab;
  const redirectTo = role ? misplacedTarget(pathname, role) : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  const { unreadTotal } = useMobileConversations();
  usePushSync(role && hasMobileApp(role) ? (session?.userId ?? null) : null);

  return {
    session,
    tabs,
    activeTab,
    badges: { [MobileTab.Messages]: unreadTotal },
    accent: mobileAccentFor(role),
    isReady: !isLoading && Boolean(session) && !redirectTo,
  };
}
