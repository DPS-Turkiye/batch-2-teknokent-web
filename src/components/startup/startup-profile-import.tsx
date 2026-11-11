"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { FileDrop } from "@/components/common/file-drop";
import { cardClass, cardHeadingClass } from "@/components/common/form-field";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { OnboardingConsent } from "@/components/onboarding/onboarding-ui";
import { ProfileAnalysisEditor } from "@/components/profile/profile-analysis-editor";
import { ProfileAnalysisSummary } from "@/components/profile/profile-analysis-summary";
import { useStartupProfileImport } from "@/hooks/use-startup-profile-import";
import {
  ProfileAnalysisStatus,
  ProfileOcrMode,
} from "@/interfaces/profile-analysis";
import { PROFILE_ANALYSIS_MAX_BYTES } from "@/lib/profile-analysis";

export function StartupProfileImport() {
  const t = useTranslations("profileAnalysis");
  const labels = useTranslations("profileTools");
  const ocrName = useId();
  const form = useStartupProfileImport();
  return (
    <section className={cardClass}>
      <div>
        <h2 className={cardHeadingClass}>{labels("importTitle")}</h2>
        <p className="mt-1 text-xs text-[#676e78]">{labels("importHint")}</p>
      </div>
      <fieldset disabled={form.isPending} className="space-y-4">
        <FileDrop
          key={form.inputVersion}
          label={labels("upload")}
          accept="application/pdf,.pdf"
          maxBytes={PROFILE_ANALYSIS_MAX_BYTES}
          helpText={t("pdfOnly")}
          file={
            form.file ? { name: form.file.name, size: form.file.size } : null
          }
          onChange={(picked) => form.chooseFile(picked?.file ?? null)}
        />
        <details className="group rounded-xl border border-[#edf0f2] bg-[#fcfcfd] px-3.5 py-3 text-sm text-[#4a5059]">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-[#3c424a]">
            {labels("advanced")}
            <ChevronDown className="size-4 text-[#858c96] transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-[#676e78]">
              {t("ocrLevel")}
            </p>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {Object.values(ProfileOcrMode).map((mode) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e4e7ea] bg-white px-3 py-1.5 text-xs has-[:checked]:border-[#e86f22] has-[:checked]:text-[#c85816]"
                >
                  <input
                    type="radio"
                    name={ocrName}
                    value={mode}
                    checked={mode === form.ocrMode}
                    onChange={() => form.setOcrMode(mode)}
                    className="accent-[#e86f22]"
                  />
                  {t(`ocr.${mode}`)}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-[#858c96]">{t("ocrHint")}</p>
          </div>
        </details>
        <OnboardingConsent
          tone={OnboardingTone.Mentee}
          checked={form.consent}
          onChange={form.setConsent}
        >
          {t("consent")}
        </OnboardingConsent>
        <p className="text-[11px] text-[#858c96]">{t("localOnly")}</p>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton
          disabled={!form.file || !form.consent || form.isPending}
          onClick={() => void form.extract()}
        >
          {form.isPending ? t("extracting") : t("extract")}
        </PrimaryButton>
        <SecondaryButton
          disabled={form.isPending}
          onClick={() => form.setShowManual(!form.showManual)}
        >
          {form.showManual ? t("closeManual") : t("openManual")}
        </SecondaryButton>
      </div>
      {form.error ? (
        <p role="alert" className="text-sm text-[#b91c1c]">
          {form.error}
        </p>
      ) : null}
      {form.showManual ? <ProfileAnalysisEditor onSaved={form.saved} /> : null}
      {form.isLoading ? (
        <p role="status" className="text-sm text-[#676e78]">
          {t("searching")}
        </p>
      ) : form.isLoadError ? (
        <p role="alert" className="text-sm text-[#b91c1c]">
          {labels("loadFailed")}{" "}
          <button
            type="button"
            onClick={() => void form.retry()}
            className="font-medium text-[#c85816] hover:underline"
          >
            {labels("retry")}
          </button>
        </p>
      ) : form.analysis ? (
        <div className="space-y-4 border-t border-[#edf0f2] pt-5">
          <ProfileAnalysisSummary analysis={form.analysis} />
          {form.analysis.status === ProfileAnalysisStatus.Draft ? (
            <ProfileAnalysisEditor
              key={form.analysis.id}
              analysis={form.analysis}
              onSaved={form.saved}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[#676e78]">{t("noProfile")}</p>
      )}
    </section>
  );
}
