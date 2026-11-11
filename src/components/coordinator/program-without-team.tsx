"use client";

import { useTranslations } from "next-intl";

import { EmptyNote, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { TeamHistory } from "@/components/common/team-history";
import { useProgramWithoutTeam } from "@/hooks/use-program-without-team";

export function ProgramWithoutTeam({ programId }: { programId: string }) {
  const t = useTranslations("programApprovals");
  const query = useProgramWithoutTeam(programId);
  if (!query.data)
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-[16px] font-semibold text-[#22262b]">
          {t("withoutTeamTitle")}
        </h2>
        <p className="text-[13px] text-[#858c96]">{t("withoutTeamHint")}</p>
      </div>
      <Panel>
        <ul className="divide-y divide-[#f1f3f5]">
          {query.data.length === 0 ? (
            <li>
              <EmptyNote>{t("withoutTeamEmpty")}</EmptyNote>
            </li>
          ) : (
            query.data.map((person) => (
              <li key={person.id} className="px-5 py-4">
                <p className="text-[13.5px] font-medium text-[#22262b]">
                  {person.fullName}
                </p>
                <p className="text-[12.5px] text-[#858c96]">
                  {[person.email, person.jobTitle].filter(Boolean).join(" · ")}
                </p>
                <TeamHistory userId={person.id} />
              </li>
            ))
          )}
        </ul>
      </Panel>
    </section>
  );
}
