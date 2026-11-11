// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { SimpleHeader } from "@/components/ia/simple-header";
import { usePublicSessionDestination } from "@/hooks/use-public-session-destination";
import { SUPPORT_EMAIL } from "@/lib/const";
import { IaAccent } from "@/types/ia-theme";

/**
 * The ODTÜ deployment's front page. Teknokent's landing sells startup mentoring, which ODTÜ does not run, so ODTÜ gets
 * a plain entry page to sign in (or, for İŞKUR students, to sign up) until its own design exists.
 */
export function OdtuLandingPage() {
  const copy = useTranslations("odtuLanding");
  const destination = usePublicSessionDestination();

  return (
    <div
      data-ia-accent={IaAccent.Odtu}
      className="flex min-h-screen flex-col bg-background-surface"
    >
      <SimpleHeader helpHref={`mailto:${SUPPORT_EMAIL}`} />
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="type-h1 text-text-primary">{copy("title")}</h1>
        <p className="type-body-lg text-text-secondary">{copy("intro")}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button href={destination.href} size={ButtonSize.Large}>
            {destination.label}
          </Button>
          {destination.signup ? (
            <Button
              href={destination.signup.href}
              variant={ButtonVariant.Ghost}
              size={ButtonSize.Large}
            >
              {destination.signup.label}
            </Button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
