"use client";

import { useSession } from "@/components/providers/session-provider";
import { roleWorkspace } from "@/lib/role-workspace";
import { useTranslations } from "next-intl";

export function usePublicSessionDestination() {
  const t = useTranslations();
  const { isLoading, session } = useSession();
  const { homeHref } = roleWorkspace(session?.role);
  const firstName = session?.fullName.trim().split(/\s+/)[0];
  const login = {
    href: session ? homeHref : "/login",
    label: firstName
      ? t("publicSession.continueAs", { name: firstName })
      : t("publicSession.signIn"),
  };
  const signup = { href: "/signup", label: t("publicSession.signUp") };

  return {
    ...login,
    isLoading,
    session,
    primaryAction: session ? login : signup,
    signup: !isLoading && !session ? signup : null,
  };
}
