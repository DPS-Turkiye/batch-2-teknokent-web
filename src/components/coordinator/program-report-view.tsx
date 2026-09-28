"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { QueryNotice } from "@/components/admin/admin-ui";
import { ProgramReporting } from "@/components/admin/reporting-view";
import { ProgramGlyph } from "@/components/coordinator/program-glyph";
import { useProgramReport } from "@/hooks/use-program-report";

/** Program raporu: the admin Raporlama numbers, for this one program. */
export function ProgramReportView({ programId }: { programId: string }) {
  const query = useProgramReport(programId);
  const data = query.data;
  if (!data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  const program = data.programs[0];
  const programHref = `/coordinator/programs/${encodeURIComponent(programId)}`;

  return (
    <div className="space-y-6">
      <nav
        aria-label="Konum"
        className="flex items-center gap-1.5 text-[13px] text-[#858c96]"
      >
        <Link href="/coordinator/programs">Programlarım</Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <Link href={programHref}>{program?.name ?? "Program"}</Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="text-[#22262b]">Program raporu</span>
      </nav>

      <header className="flex items-start gap-4">
        <ProgramGlyph muted={program?.status === "COMPLETED"} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#22262b]">
            Program raporu
          </h1>
          <p className="mt-1 text-[13.5px] text-[#676e78]">
            {program?.name} · oranlar, sayılar ve görüşme değerlendirmeleri
          </p>
        </div>
      </header>

      <ProgramReporting data={data} fixedProgram />
    </div>
  );
}
