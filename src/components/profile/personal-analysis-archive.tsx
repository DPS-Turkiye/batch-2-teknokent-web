"use client";

import { useTranslations } from "next-intl";
import { ProfileAnalysisSummary } from "@/components/profile/profile-analysis-summary";
import { usePersonalAnalysisArchive } from "@/hooks/use-personal-analysis-archive";

export function PersonalAnalysisArchive() {
  const t = useTranslations("profileTools");
  const archive = usePersonalAnalysisArchive();
  if (!archive.analysis && !archive.isError) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-[#e4e7ea] bg-white p-5">
      <h2 className="text-base font-semibold">{t("archiveTitle")}</h2>
      {archive.isError ? (
        <p role="alert" className="text-sm text-[#b42318]">
          {t("loadFailed")}{" "}
          <button type="button" onClick={archive.retry} className="underline">
            {t("retry")}
          </button>
        </p>
      ) : null}
      {archive.shared ? (
        <p className="text-sm text-[#676e78]">{t("archiveHint")}</p>
      ) : null}
      {archive.analysis ? (
        <ProfileAnalysisSummary analysis={archive.analysis} />
      ) : null}
    </section>
  );
}
