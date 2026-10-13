"use client";

import { useSession } from "@/components/providers/session-provider";
import { roleWorkspace } from "@/lib/role-workspace";
import { useTranslations } from "next-intl";

export function usePublicSessionDestination() {
  const t = useTranslations();
  const { isLoading, session } = useSession();
  const { homeHref } = roleWorkspace(session?.role);
  const firstName = session?.fullName.trim().split(/\s+/)[0];

  return {
    href: session ? homeHref : "/login",
    isLoading,
    label: firstName
      ? t("publicSession.continueAs", { name: firstName })
      : t("publicSession.signIn"),
    session,
  };
}
