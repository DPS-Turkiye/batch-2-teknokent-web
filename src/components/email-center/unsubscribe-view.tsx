// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { useUnsubscribe } from "@/hooks/use-unsubscribe";

export function UnsubscribeView({ token }: { token: string | null }) {
  const t = useTranslations("emailCenter.unsubscribe");
  const form = useUnsubscribe(token);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-[#22262b]">{t("title")}</h1>
      {form.isMissingToken ? (
        <p>{t("missingToken")}</p>
      ) : form.isDone ? (
        <p role="status">{t("done")}</p>
      ) : (
        <>
          <p className="text-sm text-[#676e78]">{t("text")}</p>
          <button
            type="button"
            onClick={form.confirm}
            disabled={form.isPending}
            className="rounded-full bg-[#e86f22] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("confirm")}
          </button>
          {form.hasFailed ? <p role="alert">{t("failed")}</p> : null}
        </>
      )}
    </main>
  );
}
