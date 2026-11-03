"use client";

import { useTranslations } from "next-intl";
import {
  ProfileAnalysisStatus,
  ProfileAnalysisType,
  type ProfileAnalysis,
} from "@/interfaces/profile-analysis";
import { list, toProfileObject } from "@/lib/profile-analysis";

export function ProfileAnalysisSummary({
  analysis,
}: {
  analysis: ProfileAnalysis;
}) {
  const t = useTranslations("profileAnalysis");
  const profile = toProfileObject(analysis.profile);
  const personal = analysis.profileType === ProfileAnalysisType.Personal;
  const summary = personal
    ? profile.professional_summary
    : profile.startup_summary;
  const technologies = list(profile.technologies);
  return (
    <div className="space-y-3 text-sm text-[#4a5059]">
      <p className="break-words font-medium">{analysis.sourceFilename}</p>
      <p className="whitespace-pre-wrap">
        {typeof summary === "string" && summary.trim()
          ? summary
          : t("noSummary")}
      </p>
      {technologies.length > 0 ? (
        <p>
          <strong>{t("technologies")}: </strong>
          {technologies.join(" · ")}
        </p>
      ) : null}
      {analysis.status === ProfileAnalysisStatus.Confirmed ? (
        <p className="font-medium text-[#008236]">{t("confirmed")}</p>
      ) : null}
    </div>
  );
}
