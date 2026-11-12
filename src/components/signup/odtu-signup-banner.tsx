"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { OdtuLoginButton } from "@/components/login/odtu-login-button";

/** Above the role cards: ODTÜ members need no sign-up, they sign in with ODTÜ (Figma "Banner · ODTÜ ile giriş"). */
export function OdtuSignupBanner() {
  const copy = useTranslations("roleSelect.odtuBanner");
  return (
    <section
      aria-labelledby="odtu-signup-banner"
      className="flex w-full flex-col gap-4 rounded-2xl border border-border-subtle px-6 py-[22px] sm:flex-row sm:items-center sm:gap-5"
    >
      <Image
        alt=""
        src="/ia/odtu/odtu-logo.png"
        width={48}
        height={40}
        className="h-10 w-12 shrink-0 object-contain"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="odtu-signup-banner"
            className="text-[18px] font-semibold text-text-primary"
          >
            {copy("title")}
          </h2>
          <span className="rounded-full bg-background-surface px-2.5 py-1 text-[11.5px] font-medium text-brand-odtu-primary">
            {copy("tag")}
          </span>
        </div>
        <p className="type-body-sm text-text-secondary">{copy("text")}</p>
      </div>
      <OdtuLoginButton compact />
    </section>
  );
}
