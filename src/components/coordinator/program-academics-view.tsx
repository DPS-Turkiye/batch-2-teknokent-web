// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { AcademicsTable } from "@/components/admin/admin-academics-table";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { useProgramAcademics } from "@/hooks/use-admin-academics";
import { ProgramTab } from "@/lib/coordinator-program-detail";

/** Office Hours › Katılımcılar › Akademisyenler: every active ODTÜ academician takes part, without invites. */
export function ProgramAcademicsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Academics}>
      {() => <ProgramAcademics programId={programId} />}
    </ProgramDetailFrame>
  );
}

function ProgramAcademics({ programId }: { programId: string }) {
  const t = useTranslations("adminAcademics");
  return (
    <AcademicsTable
      academics={useProgramAcademics(programId)}
      intro={t("programIntro")}
      showContact={false}
    />
  );
}
