"use client";

import { useTranslations } from "next-intl";

import { MentonWordmark } from "@/components/common/menton-wordmark";
import { ONBOARDING_HELP_HREF } from "@/components/onboarding/onboarding-tone";

/**
 * The plain top bar of flows outside a workspace (Figma "Header / Basit", 79:2): the wordmark, "Yardım" and, when
 * the visitor is signed in, "Çıkış yap".
 */
export function SimpleHeader({
  homeHref = "/",
  helpHref = ONBOARDING_HELP_HREF,
  onLogout,
  loggingOut = false,
}: {
  homeHref?: string;
  helpHref?: string;
  onLogout?: (() => void) | undefined;
  loggingOut?: boolean;
}) {
  const t = useTranslations("iaKit.simpleHeader");
  return (
    <header className="border-b border-border-subtle bg-background-surface">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-20">
        <MentonWordmark href={homeHref} />
        <nav className="flex items-center gap-6 type-label">
          <a
            href={helpHref}
            className="text-text-secondary hover:text-text-primary"
          >
            {t("help")}
          </a>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="text-text-primary disabled:text-text-disabled"
            >
              {loggingOut ? t("loggingOut") : t("logout")}
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
