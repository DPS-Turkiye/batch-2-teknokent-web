"use client";

import { useSession } from "@/components/providers/session-provider";
import { roleWorkspace } from "@/lib/role-workspace";

export function usePublicSessionDestination() {
  const { isLoading, session } = useSession();
  const { homeHref } = roleWorkspace(session?.role);
  const firstName = session?.fullName.trim().split(/\s+/)[0];

  return {
    href: session ? homeHref : "/login",
    isLoading,
    label: firstName ? `${firstName} olarak devam et` : "Giriş Yap",
    session,
  };
}
