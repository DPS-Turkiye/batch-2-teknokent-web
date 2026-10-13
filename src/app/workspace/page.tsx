"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { MentonWordmark } from "@/components/common/menton-wordmark";
import { useAppSession } from "@/components/providers/session-provider";
import { workspaceForSession } from "@/lib/role-workspace";

/**
 * A pass-through, not a picker. `workspaceForSession` resolves exactly one
 * workspace from the signed-in role, so this screen never had a choice to
 * offer — it asked the visitor to confirm the only option, on every login.
 * It stays a route because sign-in and invite redemption both land here before
 * they know the role.
 */
export default function WorkspacePage() {
  const t = useTranslations("workspace");
  const router = useRouter();
  const session = useAppSession();
  const { homeHref } = workspaceForSession(session);

  useEffect(() => {
    if (session) router.replace(homeHref);
  }, [session, homeHref, router]);

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
          <MentonWordmark />
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <p aria-live="polite" className="text-sm text-zinc-600">
          {t("opening")}
        </p>
      </main>
    </div>
  );
}
