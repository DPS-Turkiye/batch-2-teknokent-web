"use client";

import { useTranslations } from "next-intl";

import { useSession } from "@/components/providers/session-provider";
import { workspaceForSession } from "@/lib/role-workspace";

export function usePublicSessionDestination() {
  const t = useTranslations();
  const { isLoading, session } = useSession();
  // The account's workspace decides where "continue" leads: an ODTÜ student is a MENTEE whose home is /student.
  const { homeHref } = workspaceForSession(session);
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
