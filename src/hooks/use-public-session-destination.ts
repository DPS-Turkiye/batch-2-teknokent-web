"use client";

import { useSession } from "@/components/providers/session-provider";
import { roleWorkspace } from "@/lib/role-workspace";
import { useLocale } from "@/components/providers/locale-provider";

export function usePublicSessionDestination() {
  const { messages } = useLocale();
  const { isLoading, session } = useSession();
  const { homeHref } = roleWorkspace(session?.role);
  const firstName = session?.fullName.trim().split(/\s+/)[0];

  return {
    href: session ? homeHref : "/login",
    isLoading,
    label: firstName
      ? messages.publicSession.continueAs(firstName)
      : messages.publicSession.signIn,
    session,
  };
}
