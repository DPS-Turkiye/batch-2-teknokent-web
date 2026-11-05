"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  startupPrimaryActionClass,
  startupSecondaryActionClass,
} from "@/components/startup/startup-page-frame";
import { DocumentsStep } from "@/components/signup/steps/documents-step";
import { StartupFields } from "@/components/signup/steps/startup-fields";
import {
  StartupCreateStep,
  useStartupCreate,
} from "@/hooks/use-startup-create";

/** "Startup'ımı oluştur": the onboarding's startup step and documents step, inside the app. */
export function StartupCreateView() {
  const t = useTranslations("startupStart");
  const form = useStartupCreate();
  const onProfile = form.step === StartupCreateStep.Profile;

  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <header className="space-y-1">
        <Link
          href="/startup"
          className="text-[12.5px] text-[#676e78] hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="text-[28px] font-semibold leading-[42px] text-[#22262b]">
          {onProfile ? t("createTitle") : t("documentsTitle")}
        </h1>
        <p className="text-[13px] leading-5 text-[#676e78]">
          {onProfile ? t("createSubtitle") : t("documentsSubtitle")}
        </p>
      </header>

      {onProfile ? (
        <StartupFields form={form} />
      ) : (
        <DocumentsStep wizard={form} />
      )}

      {form.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {form.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onProfile ? (
          <button
            type="button"
            onClick={form.goToDocuments}
            disabled={!form.canContinue}
            className={startupPrimaryActionClass}
          >
            {t("continue")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={form.goToProfile}
              disabled={form.submitting}
              className={startupSecondaryActionClass}
            >
              {t("previous")}
            </button>
            <button
              type="button"
              onClick={form.submit}
              disabled={form.submitting}
              className={startupPrimaryActionClass}
            >
              {form.submitting ? t("sending") : t("sendForApproval")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
