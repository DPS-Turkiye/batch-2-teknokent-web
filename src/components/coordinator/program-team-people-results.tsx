// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { EmptyNote, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { ProfileLink } from "@/components/people/profile-link";
import type { ProgramTeamPeopleHit } from "@/interfaces/coordinator-program";
import { teamPersonLine } from "@/lib/program-launch";
import { initials } from "@/lib/utils";

/** Takımlar's person search hits: each person's own row with their role and team, and a way into the team. */
export function ProgramTeamPeopleResults({
  people,
  truncated,
  searching,
  noMatch,
  error,
  onOpenTeam,
}: {
  people: ProgramTeamPeopleHit[];
  truncated: boolean;
  searching: boolean;
  noMatch: boolean;
  error: Error | null;
  onOpenTeam: (organizationId: string) => void;
}) {
  const t = useTranslations("programTeams");
  if (error) return <QueryNotice isLoading={false} error={error} />;
  return (
    <div className="space-y-2">
      <div role="status" aria-live="polite">
        {noMatch ? <EmptyNote>{t("people.noMatch")}</EmptyNote> : null}
        {searching && people.length === 0 ? (
          <EmptyNote>{t("people.searching")}</EmptyNote>
        ) : null}
        {truncated ? (
          <p className="text-[12.5px] text-[#858c96]">
            {t("people.truncated", { count: people.length })}
          </p>
        ) : null}
      </div>
      {people.length > 0 ? (
        <Panel>
          <ul
            aria-label={t("people.results")}
            className="divide-y divide-[#f1f3f5]"
          >
            {people.map((person) => (
              <li
                key={`${person.organizationId}:${person.id}`}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f1f3f5] text-[11px] font-semibold text-[#22262b]"
                  >
                    {initials(person.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-[#22262b]">
                      {person.fullName}
                    </p>
                    <p className="text-[12.5px] text-[#858c96]">
                      {teamPersonLine(person, t)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenTeam(person.organizationId)}
                    className="rounded-full border border-[#e9ecef] px-3.5 py-2 text-[12.5px] font-medium text-[#22262b]"
                  >
                    {t("people.openTeam")}{" "}
                    <span className="sr-only">({person.teamName})</span>
                  </button>
                  <ProfileLink userId={person.id} name={person.fullName} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
