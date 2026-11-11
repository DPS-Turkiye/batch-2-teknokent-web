"use client";

import { FileText } from "lucide-react";
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
    <div className="space-y-3 rounded-xl border border-[#edf0f2] bg-[#fcfcfd] p-3.5 text-sm text-[#4a5059]">
      <div className="flex items-center gap-3">
        <FileText className="size-5 shrink-0 text-[#676e78]" />
        <p className="min-w-0 flex-1 break-words text-xs font-medium text-[#22262b]">
          {analysis.sourceFilename}
        </p>
        {analysis.status === ProfileAnalysisStatus.Confirmed ? (
          <span className="shrink-0 rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-medium text-[#15803d]">
            {t("confirmed")}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap">
        {typeof summary === "string" && summary.trim()
          ? summary
          : t("noSummary")}
      </p>
      {technologies.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-[#676e78]">
            {t("technologies")}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {technologies.map((technology) => (
              <li
                key={technology}
                className="rounded-full border border-[#e4e7ea] bg-white px-2.5 py-0.5 text-xs"
              >
                {technology}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
