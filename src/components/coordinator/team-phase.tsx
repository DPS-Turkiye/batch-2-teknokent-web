"use client";

import { useTranslations } from "next-intl";

import { EmptyNote } from "@/components/admin/admin-ui";
import { useTeamPhase } from "@/hooks/use-team-phase";

/** The team's Süreç phase in the Takımlar drawer: read-only, it follows the program's phases by date. */
export function TeamPhase({
  programId,
  organizationId,
}: {
  programId: string;
  organizationId: string;
}) {
  const t = useTranslations("programTeams.stage");
  const phase = useTeamPhase(programId, organizationId);

  if (phase.isLoading) return <EmptyNote>{t("loading")}</EmptyNote>;
  if (phase.loadFailed) return <EmptyNote>{t("loadFailed")}</EmptyNote>;

  return (
    <div className="space-y-1 rounded-2xl border border-[#e9ecef] p-4">
      <p className="text-[15px] font-semibold text-[#22262b]">{phase.title}</p>
      {phase.dates ? (
        <p className="text-[12.5px] text-[#676e78]">{phase.dates}</p>
      ) : null}
      <p className="text-[12px] text-[#858c96]">{t("byDate")}</p>
    </div>
  );
}
