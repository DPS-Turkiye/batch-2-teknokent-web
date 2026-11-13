"use client";

import { useTranslations } from "next-intl";

import { Button, ButtonSize } from "@/components/ia/button";
import { useInstitutionLogin } from "@/hooks/use-institution-login";
import { IaAccent } from "@/types/ia-theme";

/**
 * ODTÜ's sign-in, always in ODTÜ red whatever page carries it: full width on /login (Figma 79:13), a pill in the
 * sign-up banner (Figma "Button / ODTÜ ile giriş").
 */
export function OdtuLoginButton({ compact = false }: { compact?: boolean }) {
  const copy = useTranslations("login");
  const { available, starting, error, startOdtuLogin } = useInstitutionLogin();
  if (!available) return null;

  return (
    <div data-ia-accent={IaAccent.Odtu} className="flex flex-col gap-2">
      {compact ? (
        <button
          type="button"
          onClick={() => void startOdtuLogin()}
          disabled={starting}
          className="rounded-full bg-brand-odtu-primary px-5 py-[11px] text-[13px] font-medium whitespace-nowrap text-text-inverse disabled:bg-background-disabled disabled:text-text-disabled"
        >
          {copy("odtu")}
        </button>
      ) : (
        <Button
          size={ButtonSize.Large}
          fullWidth
          onClick={() => void startOdtuLogin()}
          disabled={starting}
        >
          {copy("odtu")}
        </Button>
      )}
      {error ? (
        <p role="alert" className="type-caption text-status-error-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
