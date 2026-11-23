// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { AuthShell } from "@/components/auth/auth-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { useUnsubscribe } from "@/hooks/use-unsubscribe";

export function UnsubscribeView({ token }: { token: string | null }) {
  const t = useTranslations("emailCenter.unsubscribe");
  const form = useUnsubscribe(token);

  return (
    <AuthShell>
      <div className="space-y-4 py-10 text-center">
        <h1 className="text-xl font-bold text-[#22262b]">{t("title")}</h1>
        <p role="status" className="text-sm leading-6 text-[#676e78]">
          {form.isMissingToken
            ? t("missingToken")
            : form.isDone
              ? t("done")
              : t("text")}
        </p>
        {form.canConfirm ? (
          <PrimaryButton onClick={form.confirm} disabled={form.isPending}>
            {t("confirm")}
          </PrimaryButton>
        ) : null}
        {form.hasFailed ? (
          <p role="alert" className="text-sm text-[#d9464b]">
            {t("failed")}
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
}
