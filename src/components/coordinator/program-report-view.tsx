"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { QueryNotice } from "@/components/admin/admin-ui";
import { ProgramReporting } from "@/components/admin/reporting-view";
import { ProgramGlyph } from "@/components/coordinator/program-glyph";
import { ProgramSessionsSection } from "@/components/coordinator/program-sessions-section";
import { useProgramNavigation } from "@/hooks/use-program-navigation";
import { useProgramReport } from "@/hooks/use-program-report";

/** Program raporu: the admin Raporlama numbers, for this one program. */
export function ProgramReportView({ programId }: { programId: string }) {
  const navigation = useProgramNavigation(programId);
  const t = useTranslations("programReport");
  const tNav = useTranslations("roleFrame.nav");
  const query = useProgramReport(programId);
  const data = query.data;
  if (!data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  const program = data.programs[0];
  const programHref = navigation.baseHref;

  return (
    <div className="space-y-6">
      <nav
        aria-label={t("breadcrumb")}
        className="flex items-center gap-1.5 text-[13px] text-[#858c96]"
      >
        <Link href={navigation.listHref}>
          {navigation.admin ? tNav("programs") : t("myPrograms")}
        </Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <Link href={programHref}>{program?.name ?? t("programFallback")}</Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="text-[#22262b]">{t("title")}</span>
      </nav>

      <header className="flex items-start gap-4">
        <ProgramGlyph muted={program?.status === "COMPLETED"} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#22262b]">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13.5px] text-[#676e78]">
            {t("subtitle", { name: program?.name ?? "" })}
          </p>
        </div>
      </header>

      <ProgramReporting data={data} fixedProgram />

      <ProgramSessionsSection programId={programId} />
    </div>
  );
}
