"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ProfileAnalysisEditor } from "@/components/profile/profile-analysis-editor";
import { ProfileAnalysisSummary } from "@/components/profile/profile-analysis-summary";
import { useStartupProfileImport } from "@/hooks/use-startup-profile-import";
import {
  ProfileAnalysisStatus,
  ProfileOcrMode,
} from "@/interfaces/profile-analysis";

export function StartupProfileImport() {
  const t = useTranslations("profileAnalysis");
  const labels = useTranslations("profileTools");
  const inputId = useId();
  const form = useStartupProfileImport();
  return (
    <section className="space-y-5 rounded-[24px] border border-[#e4e7ea] bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-[#22262b]">
          {labels("importTitle")}
        </h2>
        <p className="mt-1 text-sm text-[#676e78]">{labels("importHint")}</p>
      </div>
      <label htmlFor={inputId} className="block text-sm font-medium">
        {labels("upload")}
      </label>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        key={form.inputVersion}
        disabled={form.isPending}
        onChange={(event) => form.chooseFile(event.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />
      <p className="text-xs text-[#676e78]">{t("pdfOnly")}</p>
      <details className="text-sm text-[#676e78]">
        <summary className="cursor-pointer">{labels("advanced")}</summary>
        <fieldset disabled={form.isPending} className="mt-3">
          <legend>{t("ocrLevel")}</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {Object.values(ProfileOcrMode).map((mode) => (
              <label key={mode} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={inputId + "-ocr"}
                  value={mode}
                  checked={mode === form.ocrMode}
                  onChange={() => form.setOcrMode(mode)}
                />
                {t(`ocr.${mode}`)}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs">{t("ocrHint")}</p>
        </fieldset>
      </details>
      <label className="flex items-start gap-2 text-xs leading-5 text-[#676e78]">
        <input
          type="checkbox"
          checked={form.consent}
          disabled={form.isPending}
          onChange={(event) => form.setConsent(event.target.checked)}
          className="mt-1"
        />
        <span>{t("consent")}</span>
      </label>
      <p className="text-xs text-[#676e78]">{t("localOnly")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!form.file || !form.consent || form.isPending}
          onClick={() => void form.extract()}
          className="rounded-full bg-[#e86f22] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {form.isPending ? t("extracting") : t("extract")}
        </button>
        <button
          type="button"
          disabled={form.isPending}
          onClick={() => form.setShowManual(!form.showManual)}
          className="text-sm font-medium text-[#c95c18] underline"
        >
          {form.showManual ? t("closeManual") : t("openManual")}
        </button>
      </div>
      {form.error ? (
        <p role="alert" className="text-sm text-[#b42318]">
          {form.error}
        </p>
      ) : null}
      {form.showManual ? <ProfileAnalysisEditor onSaved={form.saved} /> : null}
      {form.isLoading ? (
        <p role="status" className="text-sm">
          {t("searching")}
        </p>
      ) : form.isLoadError ? (
        <p role="alert" className="text-sm text-[#b42318]">
          {labels("loadFailed")}{" "}
          <button
            type="button"
            onClick={() => void form.retry()}
            className="underline"
          >
            {labels("retry")}
          </button>
        </p>
      ) : form.analysis ? (
        <div className="space-y-4 border-t border-[#e4e7ea] pt-5">
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
